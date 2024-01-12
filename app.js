const express = require('express');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAcountkey.json');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(cors());

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('Firebase connection successful');
} catch (error) {
  console.error('Firebase initialization failed:', error);
}

const db = admin.firestore();

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

app.post('/signUp', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await admin.auth().createUser({ email, password });
    res.send('welcome');
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Error while creating user: ' + error.message);
  }
});

app.post('/index', async (req, res) => {
  try {
     
     const { name, sensorType, serialNumber } = req.body;
 
     // Check if the 'serialNumber' is already used with another object
     const querySnapshot = await db.collection('objects').where('serialNumber', '==', serialNumber).get();
 
     if (!querySnapshot.empty) {
       // If the 'serialNumber' is already used, return an error message
       res.status(400).send('Error: Serial number is already in use. Please provide a different serial number.');
       return;
     }
 
     const objectRef = await db.collection('objects').add({ name, sensorType, serialNumber });
      {
              res.status(201).send(`Object added successfully with ID: ${objectRef.id}`);
      
     }
     
  } catch (error) {
     console.error(error);
     res.status(500).send('Error while adding the object');
  }
 });
 app.put('/updateObject/:id', async (req, res) => {
  try {
     const { name, sensorType, serialNumber } = req.body;
     const objectId = req.params.id;
     const objectRef = db.collection('objects').doc(objectId);
 
     // Check if the 'serialNumber' is already used with another object
     const querySnapshot = await db.collection('objects').where('serialNumber', '==', serialNumber).get();
 
     if (!querySnapshot.empty && querySnapshot.docs[0].id !== objectId) {
       // If the 'serialNumber' is already used, return an error message
       res.status(400).send('Error: Serial number is already in use. Please provide a different serial number.');
       return;
     }
 
     await objectRef.update({ name, sensorType, serialNumber });
     res.send('Object updated successfully');
  } catch (error) {
     console.error(error);
     res.status(500).send('Error while updating the object');
  }
 });

app.get('/objects', async (req, res) => {
  try {
    const objectsSnapshot = await db.collection('objects').get();
    const objects = [];

    objectsSnapshot.forEach((doc) => {
      objects.push({ id: doc.id, ...doc.data() });
    });

    res.json(objects);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error while fetching objects');
  }
});

app.get('/objects/:id', async (req, res) => {
  try {
    const objectId = req.params.id;
    const objectDoc = await db.collection('objects').doc(objectId).get();

    if (objectDoc.exists) {
      res.json({ id: objectDoc.id, ...objectDoc.data() });
    } else {
      res.status(404).json({ error: 'Object not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Error while fetching object');
  }
});

app.delete('/objects/:id', async (req, res) => {
  try {
    const objectId = req.params.id;
    await db.collection('objects').doc(objectId).delete();
    res.json({ message: 'Object deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error while deleting the object');
  }
});

module.exports = app;