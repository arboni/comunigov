/**
 * Script para criar um usuário de teste com a flag requirePasswordChange ativada
 * 
 * Este script cria um usuário que será forçado a alterar a senha no primeiro login
 * Útil para testar o fluxo de alteração de senha obrigatória
 * 
 * Execute com: npx tsx server/create-test-user.ts
 */

import { db } from "./db";
import { users } from "@shared/schema";
import { hashPassword } from "./auth";
import { eq } from "drizzle-orm";

async function createTestUser() {
  try {
    console.log("Criando usuário de teste para alteração de senha...");
    
    const tempPassword = "senha123";
    const hashedPassword = await hashPassword(tempPassword);
    
    // Verifique se o usuário já existe
    const existingUser = await db.select().from(users).where(eq(users.username, "teste_senha"));
    
    if (existingUser.length > 0) {
      // Se o usuário existir, atualize para forçar a alteração de senha
      const [updatedUser] = await db
        .update(users)
        .set({
          password: hashedPassword,
          requirePasswordChange: true
        })
        .where(eq(users.username, "teste_senha"))
        .returning();
      
      console.log("Usuário teste_senha atualizado com sucesso!");
      console.log(`Credenciais: teste_senha / ${tempPassword}`);
      console.log("O usuário será forçado a alterar a senha no próximo login");
      
      return updatedUser;
    } else {
      // Caso contrário, crie um novo usuário
      const [newUser] = await db
        .insert(users)
        .values({
          username: "teste_senha",
          password: hashedPassword,
          email: "teste_senha@exemplo.com",
          fullName: "Usuário de Teste",
          role: "entity_member",
          position: "Testador",
          requirePasswordChange: true
        })
        .returning();
      
      console.log("Usuário teste_senha criado com sucesso!");
      console.log(`Credenciais: teste_senha / ${tempPassword}`);
      console.log("O usuário será forçado a alterar a senha no primeiro login");
      
      return newUser;
    }
  } catch (error) {
    console.error("Erro ao criar usuário de teste:", error);
    throw error;
  }
}

// Auto-executa a função principal
createTestUser()
  .then(() => {
    console.log("Script concluído com sucesso");
    process.exit(0);
  })
  .catch(error => {
    console.error("Erro na execução do script:", error);
    process.exit(1);
  });