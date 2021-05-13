const express = require('express')
const cors = require('cors')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const dotenv = require('dotenv')
dotenv.config()

// simply mongodb installed
const mongodb = require('mongodb')
const mongoClient = mongodb.MongoClient
const dbURL = process.env.dbURL

const app = express()
app.use(express.json())
app.use(cors())
app.use(cors({
    origin:"https://eazr-login-registration-form.netlify.app/"
}))

const port = process.env.PORT || 5000
app.listen(port, () => console.log('your app is running wonderfully at', port))

app.get('/', (req, res) => {
  res.send('<h1>WELCOME TO BACKEND! </h1>')
})

app.post('/register',   async (req, res) => {
    try{
    const client = await mongoClient.connect(dbURL);
    console.log("DB connected successfully!!")
    const db = client.db('Records');
    const data = await db.collection('users').findOne({ email: req.body.email });
      if (data) {
        res.status(400).json({ message: 'Email already exists..!!' })
      } else {
        const salt = await bcrypt.genSalt(10);
          const hash = await bcrypt.hash(req.body.password, salt);
            req.body.password = hash
           const result =  await db.collection('users').insertOne(req.body);
              client.close()
              res.status(200).json({ message: 'Registration successful..!!', result  })
        }
} catch (error) {
  console.log(error);
  res.json({ message: 'Something wend wrong' });
}
});

app.post('/login', (req, res) => {
  mongoClient.connect(dbURL, (err, client) => {
    if (err) throw err
    client
      .db('Records')
      .collection('users')
      .findOne({ email: req.body.email }, (err, data) => {
        if (err) throw err
        if (data) {
          bcrypt.compare(req.body.password, data.password, (err, validUser) => {
            if (err) throw err
            if (validUser) {
              jwt.sign(
                { userId: data._id, email: data.email },
                'uzKfyTDx4v5z6NSV',
                { expiresIn: '1h' },
                (err, token) => {
                  res.status(200).json({ message: 'Login success..!!', token });
                }
              )
            } else {
              res
                .status(403)
                .json({ message: 'Bad Credentials, Login unsuccessful..!!' })
            }
          })
        } else {
          res.status(401).json({
            message: 'Email is not registered, Kindly register..!!'
          })
        }
      })
  })
})

app.get('/home', authenticatedUsers, (req, res) => {
  res
    .status(200)
    .json({ message: 'Welcome To Home Page..!!!' })
})

function authenticatedUsers (req, res, next) {
  if (req.headers.authorization == undefined) {
    res.status(401).json({
      message: 'No token available in headers'
    })
  } else {
    jwt.verify(
      req.headers.authorization,
      'uzKfyTDx4v5z6NSV',
      (err, decodedString) => {
        if (decodedString == undefined) {
          res.status(401).json({ message: 'Please Login To See This Page...!!!' })
        } else {
          console.log(decodedString)
          next()
        }
      }
    )
  }
}