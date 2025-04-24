/**
 * Script para criar a tabela de relacionamento subject_entities
 * 
 * Este script cria a tabela subject_entities que relaciona assuntos com entidades
 * em um relacionamento muitos-para-muitos.
 * 
 * Execute com: npx tsx server/create-subject-entities-table.ts
 */

import { db, pool } from './db';
import { subjectEntities } from '@shared/schema';
import { sql } from 'drizzle-orm';

async function createSubjectEntitiesTable() {
  try {
    console.log('Verificando se a tabela subject_entities já existe...');
    
    const checkTableExists = await db.execute(sql`
      SELECT to_regclass('public.subject_entities') IS NOT NULL as exists;
    `);
    
    const tableExists = checkTableExists[0]?.exists;
    
    if (tableExists) {
      console.log('A tabela subject_entities já existe no banco de dados.');
      return;
    }
    
    console.log('Criando tabela subject_entities...');
    
    // Criar a tabela usando SQL direto para maior controle
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS subject_entities (
        id SERIAL PRIMARY KEY,
        subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
        entity_id INTEGER NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
        UNIQUE (subject_id, entity_id)
      );
    `);
    
    console.log('Tabela subject_entities criada com sucesso!');
  } catch (error) {
    console.error('Erro ao criar tabela subject_entities:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Auto-executar o script
createSubjectEntitiesTable().catch(console.error);