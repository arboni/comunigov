import fs from 'fs';
import { parse } from 'csv-parse/sync';
import { entities, entityTypeEnum, users, userRoleEnum } from '../shared/schema';
import { db } from './db';
import { ActivityLogger } from './activity-logger';
import { sql } from 'drizzle-orm';
import { hashPassword } from './auth';

interface EntityMember {
  fullName: string;
  email: string;
  position: string;
  phone?: string;
  whatsapp?: string;
  telegram?: string;
}

interface EntityRecord {
  name: string;
  type: string;
  headName: string;
  headPosition: string;
  headEmail: string;
  address?: string;
  phone?: string;
  website?: string;
  socialMedia?: string;
  tags?: string[];
  members?: string; // CSV string with member details in format: fullName,email,position,phone,whatsapp,telegram;fullName2,email2,...
}

/**
 * Helper function to parse the entity members string
 * @param membersString Members data in format: fullName,email,position,phone,whatsapp,telegram;fullName2,...
 * @returns Array of parsed member objects
 */
function parseMembersString(membersString: string): EntityMember[] {
  if (!membersString || membersString.trim() === '') {
    console.log("Members string is empty");
    return [];
  }
  
  console.log(`Parsing members string: "${membersString}"`);
  
  try {
    // Split by semicolon to get individual member entries
    const memberEntries = membersString.split(';').filter(entry => entry.trim() !== '');
    console.log(`Found ${memberEntries.length} member entries after split by semicolon`);
    
    const members = memberEntries.map((entry, index) => {
      console.log(`Processing member entry ${index + 1}: "${entry}"`);
      
      // Split by comma to get member fields
      const fields = entry.split(',').map(f => f.trim());
      console.log(`Found ${fields.length} fields for member ${index + 1}`);
      
      // Basic validation - need at least name, email, position
      if (fields.length < 3) {
        throw new Error(`Invalid member entry: ${entry}. Must contain at least fullName, email, and position`);
      }
      
      const member = {
        fullName: fields[0],
        email: fields[1],
        position: fields[2],
        phone: fields[3] || undefined,
        whatsapp: fields[4] || undefined,
        telegram: fields[5] || undefined
      };
      
      console.log(`Parsed member: ${JSON.stringify(member)}`);
      return member;
    });
    
    console.log(`Successfully parsed ${members.length} members`);
    return members;
  } catch (error) {
    console.error("Error parsing members string:", error);
    throw error;
  }
}

/**
 * Generate a username from email address
 * Converts email to lowercase, removes special chars and uses the part before @ symbol
 */
function generateUsernameFromEmail(email: string, index: number): string {
  // Take the part before @ and remove special characters
  const usernameBase = email.toLowerCase().split('@')[0].replace(/[^a-z0-9]/g, '');
  
  // If this is the first attempt, return as is, otherwise append a number
  return index === 0 ? usernameBase : `${usernameBase}${index}`;
}

/**
 * Generate a temporary password
 * Creates a 10-character alphanumeric password
 */
function generateTemporaryPassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let password = '';
  
  for (let i = 0; i < 10; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    password += chars.charAt(randomIndex);
  }
  
  return password;
}

export async function importEntitiesFromCSV(filePath: string, userId: number) {
  try {
    // Read the CSV file
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    // Parse the CSV file with advanced options to handle complex fields
    const records = parse(fileContent, {
      columns: (header) => {
        // Convert all header column names to the exact case we expect
        // This solves case-sensitivity issues with column names
        return header.map((column: string) => {
          // Clean up column name and standardize
          const cleaned = column.trim();
          
          // Map to our expected case-sensitive field names
          const columnMap: Record<string, string> = {
            'name': 'name',
            'type': 'type',
            'headname': 'headName',
            'headposition': 'headPosition',
            'heademail': 'headEmail',
            'address': 'address',
            'phone': 'phone',
            'website': 'website',
            'socialmedia': 'socialMedia',
            'tags': 'tags',
            'members': 'members'
          };
          
          // Get the standardized column name or keep original if not found
          const standardized = columnMap[cleaned.toLowerCase()] || cleaned;
          console.log(`Column mapping: "${cleaned}" -> "${standardized}"`);
          return standardized;
        });
      },
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true, // Don't error on inconsistent columns
      quote: '"', // Use double quotes for field enclosure
      escape: '"', // Use double quotes as escape character
      relax_quotes: true, // Handle inconsistent use of quotes
      delimiter: ',' // Explicitly set comma as delimiter
    });
    
    const results = {
      totalProcessed: records.length,
      successful: 0,
      failed: 0,
      errors: [] as string[],
      newEntities: [] as any[],
      newUsers: [] as any[]
    };
    
    // Valid entity types
    const validEntityTypes = [
      'secretariat',
      'administrative_unit',
      'external_entity',
      'government_agency',
      'association',
      'council'
    ];
    
    // Process each record
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const rowIndex = i + 2; // +2 because 1-indexed + header row
      
      try {
        // Check the record for debugging
        console.log(`Processing row ${rowIndex}, data: `, JSON.stringify(record));
        
        // Validate each required field separately for better error reporting
        const missingFields = [];
        
        if (!record.name) missingFields.push("name");
        if (!record.type) missingFields.push("type");
        if (!record.headName) missingFields.push("headName");
        if (!record.headPosition) missingFields.push("headPosition");
        if (!record.headEmail) missingFields.push("headEmail");
        
        if (missingFields.length > 0) {
          throw new Error(`Missing required field(s) in row ${rowIndex}: ${missingFields.join(', ')}. Check if column headers are exactly: name,type,headName,headPosition,headEmail,...`);
        }
        
        // Clean and validate entity type
        const entityType = record.type.trim().toLowerCase();
        if (!validEntityTypes.includes(entityType)) {
          throw new Error(`Invalid entity type "${entityType}" in row ${rowIndex}. Valid types are: ${validEntityTypes.join(', ')}`);
        }
        
        // Process tags if present
        let tags: string[] | undefined = undefined;
        if (record.tags) {
          tags = record.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean);
        }
        
        // Create entity record with properly typed fields
        const dbEntityData = {
          name: record.name,
          type: entityType as typeof entityTypeEnum.enumValues[number], // Cast to the correct enum type
          headName: record.headName,
          headPosition: record.headPosition,
          headEmail: record.headEmail,
          address: record.address || null,
          phone: record.phone || null,
          website: record.website || null,
          socialMedia: record.socialMedia || null,
          tags: tags || []
        };
        
        // Insert the entity into the database
        const [newEntity] = await db.insert(entities).values([dbEntityData]).returning();
        
        // Log the entity creation activity
        await ActivityLogger.logCreate(
          userId,
          'entity',
          newEntity.id,
          `Imported entity "${newEntity.name}" from CSV`
        );
        
        // Create the entity head user automatically
        try {
          const headUsername = generateUsernameFromEmail(record.headEmail, 0);
          const tempPassword = generateTemporaryPassword();
          const hashedPassword = await hashPassword(tempPassword);
          
          // Create the entity head user
          const [headUser] = await db.insert(users).values({
            username: headUsername,
            password: hashedPassword,
            email: record.headEmail,
            fullName: record.headName,
            role: 'entity_head' as typeof userRoleEnum.enumValues[number],
            position: record.headPosition,
            phone: record.phone || null,
            entityId: newEntity.id
          }).returning();
          
          console.log(`Created entity head user: ${headUser.username} with temporary password`);
          
          // Add to new users list - avoiding circular references
          const headUserToAdd = {
            id: headUser.id,
            username: headUser.username,
            email: headUser.email,
            fullName: headUser.fullName,
            role: headUser.role,
            position: headUser.position,
            entityId: headUser.entityId,
            tempPassword
          };
          console.log('Adding head user to results:', JSON.stringify(headUserToAdd));
          results.newUsers.push(headUserToAdd);
          
          // Log user creation
          await ActivityLogger.logCreate(
            userId,
            'user',
            headUser.id,
            `Created entity head user "${headUser.username}" for entity "${newEntity.name}"`
          );
        } catch (userError) {
          console.error(`Error creating entity head user:`, userError);
          // Continue with entity processing even if head user creation fails
          results.errors.push(`Row ${rowIndex}: Warning - Entity created but head user creation failed: ${(userError as Error).message}`);
        }
        
        // Process entity members if present
        if (record.members) {
          try {
            console.log(`Processing members string: "${record.members}"`);
            const members = parseMembersString(record.members);
            console.log(`Parsed ${members.length} members for entity "${record.name}"`);
            
            for (const member of members) {
              console.log(`Processing member: ${member.fullName}, email: ${member.email}`);
              
              let memberUsername = '';
              let usernameIndex = 0;
              let isUsernameTaken = true;
              
              // Find an available username based on the email
              while (isUsernameTaken && usernameIndex < 10) {
                memberUsername = generateUsernameFromEmail(member.email, usernameIndex);
                
                // Check if username already exists
                const existingUsers = await db.select().from(users).where(sql`username = ${memberUsername}`);
                
                if (existingUsers.length === 0) {
                  isUsernameTaken = false;
                } else {
                  usernameIndex++;
                }
              }
              
              if (isUsernameTaken) {
                throw new Error(`Could not generate a unique username for member ${member.fullName}`);
              }
              
              const tempPassword = generateTemporaryPassword();
              const hashedPassword = await hashPassword(tempPassword);
              
              // Create the entity member user
              const [memberUser] = await db.insert(users).values({
                username: memberUsername,
                password: hashedPassword,
                email: member.email,
                fullName: member.fullName,
                role: 'entity_member' as typeof userRoleEnum.enumValues[number],
                position: member.position,
                phone: member.phone || null,
                whatsapp: member.whatsapp || null,
                telegram: member.telegram || null,
                entityId: newEntity.id
              }).returning();
              
              console.log(`Created entity member user: ${memberUser.username} with temporary password`);
              
              // Add to new users list - avoiding circular references
              const userToAdd = {
                id: memberUser.id,
                username: memberUser.username,
                email: memberUser.email,
                fullName: memberUser.fullName,
                role: memberUser.role,
                position: memberUser.position,
                entityId: memberUser.entityId,
                tempPassword
              };
              console.log('Adding user to results:', JSON.stringify(userToAdd));
              results.newUsers.push(userToAdd);
              
              // Log user creation
              await ActivityLogger.logCreate(
                userId,
                'user',
                memberUser.id,
                `Created entity member user "${memberUser.username}" for entity "${newEntity.name}"`
              );
            }
          } catch (membersError) {
            console.error(`Error processing entity members:`, membersError);
            results.errors.push(`Row ${rowIndex}: Warning - Entity created but member processing failed: ${(membersError as Error).message}`);
          }
        }
        
        // Add to successful entities list
        results.newEntities.push(newEntity);
        results.successful++;
      } catch (error) {
        console.error(`Error processing row ${rowIndex}:`, error);
        results.failed++;
        results.errors.push(`Row ${rowIndex}: ${(error as Error).message}`);
      }
    }
    
    // Clean up the temporary file
    fs.unlinkSync(filePath);
    
    return results;
  } catch (error) {
    console.error('Error processing CSV file:', error);
    // Clean up the temporary file if it exists
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    throw error;
  }
}