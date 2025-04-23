import fs from 'fs';
import { parse } from 'csv-parse/sync';
import { entities, entityTypeEnum, users, userRoleEnum } from '../shared/schema';
import { db } from './db';
import { ActivityLogger } from './activity-logger';
import { sql, eq } from 'drizzle-orm';
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

/**
 * Import entities from a CSV file
 * This function only imports entities without members
 * @param filePath Path to the CSV file
 * @param userId ID of the user performing the import
 * @returns Import results with created entities
 */
export async function importEntitiesFromCSV(filePath: string, userId: number) {
  try {
    // Read the CSV file
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    // Determine delimiter used in the file (comma or semicolon)
    const firstLine = fileContent.split('\n')[0];
    const hasSemicolon = firstLine.includes(';');
    const hasComma = firstLine.includes(',');
    const delimiter = hasSemicolon ? ';' : (hasComma ? ',' : ','); // Default to comma if neither found
    
    console.log(`Detected delimiter: "${delimiter}" in CSV file`);
    
    // Preprocess headers if necessary (for semicolon delimited files with headers like "name;type;...")
    const preprocessedContent = fileContent.startsWith('name;') || fileContent.startsWith('name,') 
      ? fileContent 
      : fileContent;
    
    // Parse the CSV file with advanced options to handle complex fields
    const records = parse(preprocessedContent, {
      columns: (header) => {
        // If we have a single header item containing semicolons, split it into separate headers
        let processedHeader = header;
        if (header.length === 1 && header[0].includes(';')) {
          processedHeader = header[0].split(';');
          console.log("Split semicolon-separated header into separate columns");
        }
        
        // Handle potential CSV export formats with quoted fields
        processedHeader = processedHeader.map((col: string) => {
          return col.replace(/^"(.*)"$/, '$1').trim(); // Remove quotes if present
        });
        
        // Log processed headers
        console.log("CSV Headers found:", processedHeader);
        
        return processedHeader.map((column: string) => {
          // Clean up column name and standardize
          const cleaned = column.trim();
          
          // Map to our expected case-sensitive field names - CASE INSENSITIVE matching
          const columnMap: Record<string, string> = {
            // English column names
            'name': 'name',
            'type': 'type',
            'headname': 'headName',
            'head_name': 'headName',
            'head name': 'headName',
            'responsiblename': 'headName',
            'responsible name': 'headName',
            'responsible_name': 'headName',
            'headposition': 'headPosition',
            'head_position': 'headPosition',
            'head position': 'headPosition',
            'responsibleposition': 'headPosition',
            'responsible position': 'headPosition',
            'responsible_position': 'headPosition',
            'heademail': 'headEmail',
            'head_email': 'headEmail',
            'head email': 'headEmail',
            'responsibleemail': 'headEmail',
            'responsible email': 'headEmail',
            'responsible_email': 'headEmail',
            'address': 'address',
            'phone': 'phone',
            'website': 'website',
            'socialmedia': 'socialMedia',
            'social_media': 'socialMedia',
            'social media': 'socialMedia',
            'tags': 'tags',
            
            // Portuguese column names
            'nome': 'name',
            'tipo': 'type',
            'nomeresponsavel': 'headName',
            'nome_responsavel': 'headName',
            'nome responsavel': 'headName',
            'responsavel': 'headName',
            'posicaoresponsavel': 'headPosition',
            'posicao_responsavel': 'headPosition',
            'posicao responsavel': 'headPosition',
            'cargoresponsavel': 'headPosition',
            'cargo_responsavel': 'headPosition',
            'cargo responsavel': 'headPosition',
            'emailresponsavel': 'headEmail',
            'email_responsavel': 'headEmail',
            'email responsavel': 'headEmail',
            'endereco': 'address',
            'telefone': 'phone',
            'site': 'website',
            'redessociais': 'socialMedia',
            'redes_sociais': 'socialMedia',
            'redes sociais': 'socialMedia',
            'etiquetas': 'tags'
            // Note: 'members' field removed from entity import
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
      delimiter: delimiter // Use auto-detected delimiter
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
          // Provide detailed guidance on CSV header format and accepted column names
          const guidance = `
Missing required field(s) in row ${rowIndex}: ${missingFields.join(', ')}. 

CSV HEADER GUIDE:
* Headers should be in the first row
* Required columns: name, type, headName, headPosition, headEmail
* Also accepts Portuguese headers: nome, tipo, nomeResponsavel, cargoResponsavel, emailResponsavel
* Accepts both commas and semicolons as separators
* Headers are case-insensitive

Example of correct CSV format:
name,type,headName,headPosition,headEmail,address,phone,website,socialMedia,tags
"Entity Name","secretariat","Head Person","Director","head@example.com","Entity Address","555-1234","website.com","twitter/entity","tag1,tag2"
          `;
          throw new Error(guidance);
        }
        
        // Clean and validate entity type
        let entityType = record.type.trim().toLowerCase();
        
        // Handle encoding issues by normalizing common entity types
        if (entityType.includes('associa')) {
          entityType = 'association';
          console.log(`Row ${rowIndex}: Normalized entity type from "${record.type}" to "association"`);
        } else if (entityType.includes('secr')) {
          entityType = 'secretariat';
          console.log(`Row ${rowIndex}: Normalized entity type from "${record.type}" to "secretariat"`);
        } else if (entityType.includes('govern')) {
          entityType = 'government_agency';
          console.log(`Row ${rowIndex}: Normalized entity type from "${record.type}" to "government_agency"`);
        } else if (entityType.includes('admin')) {
          entityType = 'administrative_unit';
          console.log(`Row ${rowIndex}: Normalized entity type from "${record.type}" to "administrative_unit"`);
        } else if (entityType.includes('extern')) {
          entityType = 'external_entity';
          console.log(`Row ${rowIndex}: Normalized entity type from "${record.type}" to "external_entity"`);
        } else if (entityType.includes('coun')) {
          entityType = 'council';
          console.log(`Row ${rowIndex}: Normalized entity type from "${record.type}" to "council"`);
        }
        
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
        
        // Note: Members are now imported separately through a different endpoint
        
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

/**
 * Import entity members from a CSV file for a specific entity
 * @param filePath Path to the CSV file
 * @param entityId ID of the entity to add members to
 * @param userId ID of the user performing the import
 * @returns Import results with created members
 */
export async function importEntityMembersFromCSV(filePath: string, entityId: number, userId: number) {
  try {
    // Read the CSV file
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    // Determine delimiter used in the file (comma or semicolon)
    const firstLine = fileContent.split('\n')[0];
    const hasSemicolon = firstLine.includes(';');
    const hasComma = firstLine.includes(',');
    const delimiter = hasSemicolon ? ';' : (hasComma ? ',' : ','); // Default to comma if neither found
    
    console.log(`Detected delimiter: "${delimiter}" in member CSV file`);
    
    // Preprocess headers if necessary
    const preprocessedContent = fileContent;
    
    // Parse the CSV file with advanced options to handle complex fields
    const records = parse(preprocessedContent, {
      columns: (header) => {
        // If we have a single header item containing semicolons, split it into separate headers
        let processedHeader = header;
        if (header.length === 1 && header[0].includes(';')) {
          processedHeader = header[0].split(';');
          console.log("Split semicolon-separated header into separate columns");
        }
        
        // Handle potential CSV export formats with quoted fields
        processedHeader = processedHeader.map((col: string) => {
          return col.replace(/^"(.*)"$/, '$1').trim(); // Remove quotes if present
        });
        
        console.log("CSV Headers found:", processedHeader);
        
        // Filter out any comment rows or empty columns
        const filteredHeader = processedHeader.filter((col: string) => 
          col && !col.trim().startsWith('#') && col.trim() !== ''
        );
        
        return filteredHeader.map((column: string) => {
          // Clean up column name and standardize
          const cleaned = column.trim();
          
          // Map to our expected case-sensitive field names for member imports - CASE INSENSITIVE
          const columnMap: Record<string, string> = {
            // English column names
            'fullname': 'fullName',
            'full_name': 'fullName',
            'full name': 'fullName',
            'name': 'fullName',
            'email': 'email',
            'position': 'position',
            'job title': 'position',
            'job_title': 'position',
            'jobtitle': 'position',
            'title': 'position',
            'role': 'position',
            'phone': 'phone',
            'telephone': 'phone',
            'phone_number': 'phone',
            'phonenumber': 'phone',
            'whatsapp': 'whatsapp',
            'whatsapp_number': 'whatsapp',
            'whatsappnumber': 'whatsapp',
            'telegram': 'telegram',
            'telegram_username': 'telegram',
            'telegramusername': 'telegram',
            
            // Portuguese column names
            'nomecompleto': 'fullName',
            'nome_completo': 'fullName',
            'nome completo': 'fullName',
            'nome': 'fullName',
            'cargo': 'position',
            'funcao': 'position',
            'função': 'position',
            'posicao': 'position',
            'posição': 'position',
            'telefone': 'phone',
            'fone': 'phone',
            'celular': 'phone',
            'numero_whatsapp': 'whatsapp',
            'whatsapp_numero': 'whatsapp',
            'whatsapp numero': 'whatsapp',
            'usuario_telegram': 'telegram',
            'usuario telegram': 'telegram',
            'telegram_usuario': 'telegram'
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
      delimiter: delimiter, // Use auto-detected delimiter
      comment: '#' // Skip lines that start with #
    });
    
    const results = {
      totalProcessed: records.length,
      successful: 0,
      failed: 0,
      errors: [] as string[],
      entityId: entityId,
      newUsers: [] as any[]
    };
    
    // Fetch the entity to verify it exists
    const [entity] = await db.select().from(entities).where(sql`id = ${entityId}`);
    if (!entity) {
      throw new Error(`Entity with ID ${entityId} not found`);
    }
    
    // Process each record
    for (let i = 0; i < records.length; i++) {
      const member = records[i];
      const rowIndex = i + 2; // +2 because 1-indexed + header row
      
      try {
        // Check the record for debugging
        console.log(`Processing member row ${rowIndex}, data: `, JSON.stringify(member));
        
        // Skip rows that look like comment rows
        if (Object.keys(member).some(key => key.includes('CSV Template') || key.startsWith('#'))) {
          console.log(`Skipping row ${rowIndex} - appears to be a comment row`);
          continue;
        }
        
        // Check if the row is a duplicate header row (contains column name as a value)
        const isHeaderRow = Object.values(member).some(
          value => typeof value === 'string' && 
          (value.toLowerCase() === 'fullname' || 
           value.toLowerCase() === 'email' || 
           value.toLowerCase() === 'position')
        );
        
        if (isHeaderRow) {
          console.log(`Skipping row ${rowIndex} - appears to be a header row`);
          continue;
        }
        
        // Handle case where the CSV might be incorrectly parsed
        // Sometimes CSV parsing results in unexpected object structures
        let fullName = member.fullName;
        let email = member.email;
        let position = member.position;
        
        // Try to find values in case of incorrect parsing - check all object keys
        if (!fullName || !email || !position) {
          // Look for fields in case-insensitive way
          Object.entries(member).forEach(([key, value]) => {
            const lowerKey = key.toLowerCase();
            if (lowerKey.includes('fullname') || lowerKey.includes('full name') || lowerKey.includes('name')) {
              fullName = String(value);
            } else if (lowerKey.includes('email')) {
              email = String(value);
            } else if (lowerKey.includes('position') || lowerKey.includes('role') || lowerKey.includes('title')) {
              position = String(value);
            }
          });
          
          // Update the member object with the found values
          member.fullName = fullName;
          member.email = email;
          member.position = position;
        }
        
        // Validate each required field separately for better error reporting
        const missingFields = [];
        
        if (!member.fullName) missingFields.push("fullName");
        if (!member.email) missingFields.push("email");
        if (!member.position) missingFields.push("position");
        
        if (missingFields.length > 0) {
          // Provide detailed guidance on CSV header format and accepted column names
          const guidance = `
Missing required field(s) in row ${rowIndex}: ${missingFields.join(', ')}. 

CSV MEMBER IMPORT GUIDE:
* Headers should be in the first row
* Required columns: fullName, email, position
* Optional columns: phone, whatsapp, telegram
* Also accepts Portuguese headers: nome/nomeCompleto, email, cargo/posicao, telefone
* Accepts both commas and semicolons as separators
* Headers are case-insensitive

Example of correct CSV format:
fullName,email,position,phone,whatsapp,telegram
"Person Name","person@example.com","Position Title","555-1234","5551234","@telegram_handle"
          `;
          throw new Error(guidance);
        }
        
        // Generate username for the member
        let memberUsername = '';
        let usernameIndex = 0;
        let isUsernameTaken = true;
        
        // Find an available username based on the email
        while (isUsernameTaken && usernameIndex < 10) {
          memberUsername = generateUsernameFromEmail(member.email, usernameIndex);
          
          // Check if username already exists
          const existingUsers = await db.select().from(users).where(eq(users.username, memberUsername));
          
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
          entityId: entityId
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
          `Created entity member user "${memberUser.username}" for entity "${entity.name}"`
        );
        
        results.successful++;
      } catch (error) {
        console.error(`Error processing member row ${rowIndex}:`, error);
        results.failed++;
        results.errors.push(`Row ${rowIndex}: ${(error as Error).message}`);
      }
    }
    
    // Clean up the temporary file
    fs.unlinkSync(filePath);
    
    return results;
  } catch (error) {
    console.error('Error processing members CSV file:', error);
    // Clean up the temporary file if it exists
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    throw error;
  }
}