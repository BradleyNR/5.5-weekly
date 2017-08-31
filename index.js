const express = require('express');
const exphbs = require('express-handlebars');
const session = require('express-session');
const bodyparser = require('body-parser');
const expressValidator = require('express-validator');
const fs = require('fs');

const app = express();

//views
app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

//middleware
app.use(bodyparser.urlencoded({extended: false}));
app.use(expressValidator());
app.use(session({
  secret: 'hiddenbobiddenzopiddenmomiddenloliddensosidden',
  resave: false,
  saveUninitialized: true
}));

//array of strings
const words = fs.readFileSync("/usr/share/dict/words", "utf-8").toLowerCase().split("\n");

//custom middleware
app.use((req, res, next) =>{
  //check if unique word in session exists, if not make it. If so, skip making it.
  if (req.session.uniqueWord) {
    return next();
  }
  let randomWord = words[Math.floor(Math.random() * words.length)];
  //array of the letters of the random word
  req.session.randomWordArray = randomWord.split('');
  //each session's unique word
  req.session.uniqueWord = randomWord;
  //each session's guesses
  req.session.guesses = [];
  req.session.guessCounter = 8;
  //creates an array with length equal to the word's length, then fills it with underscores
  req.session.letterSpace = new Array(req.session.uniqueWord.length).fill('_');
  next();
});


app.get('/', (req, res) => {
  //pull random word
  console.log('The Word is: ' + req.session.uniqueWord);
  res.render('index', {
    //word
    randomWord: req.session.uniqueWord,
    //array of _ representing letters joined with spaces
    letterSpace: req.session.letterSpace.join(' '),
    //array of guesses joined with spaces
    guesses: req.session.guesses.join(' '),
    //number of guesses left
    guessCounter: req.session.guessCounter,
    //win or lose
    winState: req.session.winState});
});

app.post('/check', (req, res) =>{
  //if the array of guesses does not include the guess, add it
  if (!req.session.guesses.includes(req.body.guess) && req.body.guess.length == 1) {
    req.session.guesses.push(req.body.guess);
  }
  //if the word doesn't include the letter guessed, remove a turn (if turns are > 0)
  if (!req.session.randomWordArray.includes(req.body.guess) && req.session.guessCounter != 0) {
    req.session.guessCounter = req.session.guessCounter - 1;
  }

  //for each underscore
  req.session.letterSpace.forEach((item, index) =>{
    //if array of guessed letters includes letter from array of random word
      if (req.session.guesses.includes(req.session.randomWordArray[index])) {
        //set the _ equal to that letter
        req.session.letterSpace[index] = req.session.randomWordArray[index];
      }
  });

  //win and loss message
  if (req.session.guessCounter == 0) {
    req.session.winState = 'You Lose!';
  } else if (req.session.letterSpace.join('') == req.session.uniqueWord && req.session.guessCounter > 0) {
    req.session.winState = 'You Win!';
  }

  //error logic
  req.checkBody("guess", "Only one character may be entered.").isLength(1, 1);
  req.checkBody('guess', 'Guess cannot be empty!').notEmpty();
  req.checkBody("guess", "Only letters may be entered.").isAlpha();
  let errors = req.validationErrors();


  //if there are errors, render the home page again with those errors, else redirect to home page
  if (errors) {
    //make sure turns don't go down when errors are thrown
    req.session.guessCounter = req.session.guessCounter + 1;
    res.render('index', {
      //word
      randomWord: req.session.uniqueWord,
      //array of _ representing letters joined with spaces
      letterSpace: req.session.letterSpace.join(' '),
      //array of guesses joined with spaces
      guesses: req.session.guesses.join(' '),
      //number of guesses left
      guessCounter: req.session.guessCounter,
      //win or lose
      winState: req.session.winState,
      //errors
      errors: errors
    });
  } else {
    res.redirect('/');
  }
});

app.post('/newgame', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});



app.listen(3000);
