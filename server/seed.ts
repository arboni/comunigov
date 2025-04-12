import { storage } from './storage';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

export async function seedDefaultAdmin() {
  try {
    console.log('Checking for default admin user...');
    
    // Check if admin user already exists
    const existingAdmin = await storage.getUserByUsername('admin');
    if (existingAdmin) {
      console.log('Default admin user already exists, skipping creation');
      return;
    }
    
    // Hash password
    const password = 'admin123';
    const salt = randomBytes(16).toString('hex');
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    const hashedPassword = `${buf.toString('hex')}.${salt}`;
    
    // Create default admin user
    const adminUser = await storage.createUser({
      username: 'admin',
      password: hashedPassword,
      email: 'admin@comunigov.com',
      fullName: 'System Administrator',
      role: 'master_implementer',
      phone: null,
      whatsapp: null,
      telegram: null,
      position: 'System Administrator',
      entityId: null
    });
    
    console.log('Default admin user created successfully:', {
      id: adminUser.id,
      username: adminUser.username,
      email: adminUser.email,
      role: adminUser.role
    });
  } catch (error) {
    console.error('Error creating default admin user:', error);
  }
}