const { auth, db } = require('../config/firebase');
const bcrypt = require('bcryptjs');

/**
 * Seed Firebase database with demo data
 */
const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // Sample users data
    const users = [
      {
        firstName: 'Dr. John',
        lastName: 'Smith',
        email: 'doctor@clinic.com',
        password: 'doctor123',
        phone: '+1234567890',
        role: 'doctor',
        specialization: 'General Dentistry',
        licenseNumber: 'DEN-12345',
      },
      {
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'patient@example.com',
        password: 'patient123',
        phone: '+1234567891',
        role: 'patient',
        dateOfBirth: '1990-05-15',
        gender: 'female',
        address: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA',
        },
        medicalHistory: {
          allergies: ['Penicillin'],
          chronicConditions: [],
          currentMedications: [],
          previousDentalProcedures: ['Teeth Cleaning'],
          notes: 'Regular checkups',
        },
      },
      {
        firstName: 'Bob',
        lastName: 'Johnson',
        email: 'bob@example.com',
        password: 'patient123',
        phone: '+1234567892',
        role: 'patient',
        dateOfBirth: '1985-08-20',
        gender: 'male',
        address: {
          street: '456 Oak Ave',
          city: 'Los Angeles',
          state: 'CA',
          zipCode: '90001',
          country: 'USA',
        },
        medicalHistory: {
          allergies: [],
          chronicConditions: ['Diabetes'],
          currentMedications: ['Metformin'],
          previousDentalProcedures: ['Root Canal', 'Crown'],
          notes: 'Requires special care due to diabetes',
        },
      },
    ];

    console.log('👥 Creating users...');

    for (const userData of users) {
      try {
        // Check if user already exists
        let userRecord;
        try {
          userRecord = await auth.getUserByEmail(userData.email);
          console.log(`⚠️  User ${userData.email} already exists, skipping...`);
          continue;
        } catch (error) {
          // User doesn't exist, create new one
        }

        // Create user in Firebase Auth
        userRecord = await auth.createUser({
          email: userData.email,
          password: userData.password,
          displayName: `${userData.firstName} ${userData.lastName}`,
        });

        // Hash password for Firestore
        const hashedPassword = await bcrypt.hash(userData.password, 10);

        // Prepare user document
        const userDoc = {
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          password: hashedPassword,
          phone: userData.phone,
          role: userData.role,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // Add role-specific fields
        if (userData.role === 'patient') {
          userDoc.dateOfBirth = userData.dateOfBirth;
          userDoc.gender = userData.gender;
          userDoc.address = userData.address || {};
          userDoc.medicalHistory = userData.medicalHistory || {
            allergies: [],
            chronicConditions: [],
            currentMedications: [],
            previousDentalProcedures: [],
            notes: '',
          };
          userDoc.visitCount = 0;
          userDoc.totalMoneySpent = 0;
          userDoc.lastVisitDate = null;
        }

        if (userData.role === 'doctor') {
          userDoc.specialization = userData.specialization;
          userDoc.licenseNumber = userData.licenseNumber;
        }

        // Save to Firestore
        await db.collection('users').doc(userRecord.uid).set(userDoc);

        console.log(`✅ Created user: ${userData.email}`);
      } catch (error) {
        console.error(`❌ Error creating user ${userData.email}:`, error.message);
      }
    }

    console.log('\n✅ Database seeded successfully!');
    console.log('\n📝 Login Credentials:');
    console.log('Doctor:');
    console.log('  Email: doctor@clinic.com');
    console.log('  Password: doctor123');
    console.log('\nPatient:');
    console.log('  Email: patient@example.com');
    console.log('  Password: patient123');
    console.log('\nPatient 2:');
    console.log('  Email: bob@example.com');
    console.log('  Password: patient123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

// Run seed
seedDatabase();
