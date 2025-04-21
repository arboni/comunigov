import fs from 'fs';
import { parse } from 'csv-parse/sync';
import { entities, entityTypeEnum, users, userRoleEnum } from '../shared/schema';
import { db } from './db';
import { ActivityLogger } from './activity-logger';
import { SQL } from 'drizzle-orm';
import { hashPassword } from './auth';

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
}

/**
 * Process a CSV file and import entities
 * @param filePath Path to the uploaded CSV file
 * @param userId ID of the user performing the import
 * @returns Result of the import operation
 */
export async function importEntitiesFromCSV(filePath: string, userId: number) {
  try {
    // Read the CSV file
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    // Parse the CSV file
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });
    
    const results = {
      totalProcessed: records.length,
      successful: 0,
      failed: 0,
      errors: [] as string[],
      newEntities: [] as any[]
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
        // Validate required fields
        if (!record.name || !record.type || !record.headName || !record.headPosition || !record.headEmail) {
          throw new Error(`Missing required field(s) in row ${rowIndex}`);
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
        
        // Log the activity
        await ActivityLogger.logCreate(
          userId,
          'entity',
          newEntity.id,
          `Imported entity "${newEntity.name}" from CSV`
        );
        
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