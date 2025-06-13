const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// Check if password is provided as command line argument
const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Please provide a password as a command line argument:');
  console.error('Example: node init-db.js your-secure-password');
  process.exit(1);
}

const adminEmail = 'contact@seadonwhite.com';
const password = args[0];

if (password.length < 6) {
  console.error('Error: Password must be at least 6 characters long');
  process.exit(1);
}

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const auth = admin.auth();

async function initializeDatabase() {
  try {

    // Create or update the auth user
    let user;
    try {
      user = await auth.getUserByEmail(adminEmail);
      console.log('Updating existing admin user...');
      await auth.updateUser(user.uid, {
        password: password,
        emailVerified: true
      });
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        console.log('Creating new admin user...');
        user = await auth.createUser({
          email: adminEmail,
          password: password,
          emailVerified: true
        });
      } else {
        throw error;
      }
    }
    
    // Set admin user data in Firestore
    const userRef = db.collection('users').doc(user.uid);
    await userRef.set({
      email: adminEmail,
      displayName: 'Admin User',
      isAdmin: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastLogin: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    
    console.log('Admin user created successfully!');
    
    // Add some sample artworks (optional)
    const artworks = [
      {
        title: 'Sample Artwork 1',
        description: 'A beautiful piece of art',
        price: 199.99,
        imageUrl: 'https://example.com/art1.jpg',
        category: 'Painting',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      },
      {
        title: 'Sample Artwork 2',
        description: 'Another amazing artwork',
        price: 299.99,
        imageUrl: 'https://example.com/art2.jpg',
        category: 'Sculpture',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }
    ];
    
    const batch = db.batch();
    artworks.forEach(artwork => {
      const docRef = db.collection('artworks').doc();
      batch.set(docRef, artwork);
    });
    
    await batch.commit();
    console.log('Sample artworks added successfully!');
    
  } catch (error) {
    console.error('Error initializing database:', error);
  } finally {
    process.exit(0);
  }
}

initializeDatabase();
