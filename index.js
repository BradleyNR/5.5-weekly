const express = require('express');
const exphbs = require('express-handlebars');
const session = require('express-session');
const bodyparser = require('body-parser');
const fs = require('fs');

const app = express();

//views
app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

//middleware
app.use(bodyparser.urlencoded({extended: false}));
app.use(session({
  secret: 'hiddenbobiddenzopiddenmomiddenloliddensosidden',
  resave: false,
  saveUninitialized: true
}));

//array of strings
const words = fs.readFileSync("/usr/share/dict/words", "utf-8").toLowerCase().split("\n");
let guesses = [];
let guessCounter = 8;

//custom middleware
app.use((req, res, next) =>{
  //check if unique word in session exists, if not make it. If so, skip making it.
  if (req.session.uniqueWord) {
    return next();
  }
  let randomWord = words[Math.floor(Math.random() * words.length)];
  req.session.randomWordArray = randomWord.split('');
  req.session.uniqueWord = randomWord;
  req.session.guesses = [];
  //creates an array with length equal to the word's length, then fills it with underscores
  req.session.letterSpace = new Array(req.session.uniqueWord.length).fill('_');
  next();
});


app.get('/', (req, res) => {
  //pull random word
  console.log(req.session.uniqueWord);
  res.render('index', {
    //word
    randomWord: req.session.uniqueWord,
    //array of _ representing letters joined with spaces
    letterSpace: req.session.letterSpace.join(' '),
    //array of guesses joined with spaces
    guesses: req.session.guesses.join(' '),
    //number of guesses left
    guessCounter: guessCounter});
});

app.post('/check', (req, res) =>{
  //if the array of guesses does not include the guess, add it
  if (!req.session.guesses.includes(req.body.guess)) {
    req.session.guesses.push(req.body.guess);
  }
  //for each underscore
  req.session.letterSpace.forEach((item, index) =>{
    //if array of guessed letters includes letter from array of random word
      if (req.session.guesses.includes(req.session.randomWordArray[index])) {
        //set the _ equal to that letter
        req.session.letterSpace[index] = req.session.randomWordArray[index];
      }
  });
  res.redirect('/');
});



app.listen(3000);
