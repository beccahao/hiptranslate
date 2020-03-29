import React, { Component } from "react";
import cookie from "react-cookies";
import Box from '@material-ui/core/Box';
import Container from '@material-ui/core/Container';
import Grid from '@material-ui/core/Grid';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';

import { googleTranslate } from "./utils/googleTranslate";
import axios from "axios"; // for backend

class App extends Component {
  state = {
    languageCodes: [{language: "en", name: "English"}, {language: "es", name: "Spanish"}, {language: "zh", name: "Chinese (Simplified)"}],
    sourceLang: cookie.load("sourceLang") ? cookie.load("sourceLang") : "en",
    targetLang: cookie.load("targetLang") ? cookie.load("targetLang") : "zh",
    domain: cookie.load("domain") ? cookie.load("domain") : "None selected",
    sourceText: cookie.load("sourceText") ? cookie.load("sourceText") : "Copy text here",
    translation: cookie.load("translation") ? cookie.load("translation") : "None yet.",
    targetText: cookie.load("targetText") ? cookie.load("targetText") : "Press \"TRANSLATE!\" for a translation",

    rulesVisible: cookie.load("rulesVisible") ? cookie.load("rulesVisible") : [false, false, false, false, false, false],
    rulesActive: cookie.load("rulesActive") ? cookie.load("rulesActive") : [false, false, false, false, false, false],
    rulesNames: ["amount = 的数量", "Program = 学前机构", "Verb + 得", "Chinese drops certain pronouns at beginning of clause: Remove pronouns.",
      "Replace repeated nouns in a sentence with pronouns.", "Chinese drops certain pronouns at beginning of clause: Bring back pronouns?"],
    rulesIndices: [0,1,2,3,4,5],

    data: [],
    id: 0,
    intervalIsSet: false,
    uniqueId: cookie.load("uniqueId") ? cookie.load("uniqueId") : Math.floor(Math.random() * 100000000),
  };

  // Helper functions on button clicks
  // 1. Translate the text based on current state
  translateText() {
    let { sourceText, targetText, targetLang } = this.state;
    let transText = "";

    const translating = transText => {
      if (targetText !== transText) {
        console.log(transText);
        this.setState({ targetText: transText });
        this.setState({ translation: transText });
        cookie.save("translation", transText, { path: "/" });
        cookie.save("targetText", transText, { path: "/" });
      }
    };

    googleTranslate.translate(sourceText, targetLang, function(err, trans) {
      transText = trans.translatedText;
      translating(transText);
    });

    console.log("Text translated.");
  }

  // 2. Fetch all existing data when component mounts
  componentDidMount() {
    this.getDataFromDb();
    if (!this.state.intervalIsSet) {
      let interval = setInterval(this.getDataFromDb, 5000);
      this.setState({ intervalIsSet: interval });
    }
  }

  // 3. Kill process when done using
  componentWillUnmount() {
    if (this.state.intervalIsSet) {
      clearInterval(this.state.intervalIsSet);
      this.setState({ intervalIsSet: null });
    }
  }

  // 4. Get method that uses backend api to get data from database
  getDataFromDb = () => {
    fetch('/api/getData')
      .then((data) => data.json())
      .then((res) => this.setState({ data: res.data }));
  };

  // 5. Put method backend api to create new entry into our data base
  putDataToDB = (uniqueId, sourceLang, targetLang, sourceText, targetText, domain, translation) => {
    let currentIds = this.state.data.map((data) => data.id);
    let idToBeAdded = 1;
    while (currentIds.includes(idToBeAdded)) {
      ++idToBeAdded;
    }

    axios.post('/api/putData', {
      id: idToBeAdded,
      uniqueId: uniqueId,
      sourceLang: sourceLang,
      targetLang: targetLang,
      sourceText: sourceText,
      targetText: targetText,
      domain: domain,
      translation: translation
    });

    alert("Your edits have been submitted. Thank you!");
  };

  // 6. Toggles fix (on/off) based on number and current state.
  // Checks against the transText for prototyped/hardcoded behavior.
  toggleRule(ruleNum) {
    let { rulesActive } = this.state;
    let { targetText } = this.state;
    let rulez = rulesActive;

    // en --> zh rules
    // rule 0 = amount of = 的数量
    // rule 1 = Program = 学前机构
    // rule 2 = Verb + 得
    // rule 3 = Chinese drops certain pronouns at beginning of clause: Remove pronouns.

    // zh --> en rules
    // rule 4 = Replace repeated nouns in a sentence with pronouns.
    // rule 5 = Chinese drops certain pronouns at beginning of clause: Bring back pronouns?

    // passage 1, translation starts with 我们的方法
    // passage 2, translation starts with 计划应使用
    // passage 3, translation starts with For example, I let
    // passage 4, translation starts with As a good teacher

    // TODO: Make this not hard coded -- it is not very nice looking! :)
    if (targetText.includes("我们的方法") && ruleNum === 0 && !rulez[ruleNum]) {
      targetText = targetText.replace("大量学习", "学习的数量");
    }
    if (targetText.includes("我们的方法") && ruleNum === 0 && rulez[ruleNum]) {
      targetText = targetText.replace("学习的数量", "大量学习");
    }

    if (targetText.includes("我们的方法") && ruleNum === 2 && !rulez[ruleNum]) {
      targetText = targetText.replace("教的更少", "教得更少");
    }
    if (targetText.includes("我们的方法") && ruleNum === 2 && rulez[ruleNum]) {
      targetText = targetText.replace("教得更少", "教的更少");
    }

    if (targetText.includes("我们的方法") && ruleNum === 3 && !rulez[ruleNum]) {
      targetText = targetText.replace("我们教", "教");
      targetText = targetText.replace("我们提供", "提供");
    }
    if (targetText.includes("我们的方法") && ruleNum === 3 && rulez[ruleNum]) {
      targetText = targetText.replace("教", "我们教");
      targetText = targetText.replace("提供", "我们提供");
    }

    if (targetText.includes("计划应使用") && ruleNum === 1 && !rulez[ruleNum]) {
      targetText = targetText.replace("计划应", "学前机构应");
      targetText = targetText.replace("计划还", "学前机构还");
    }
    if (targetText.includes("计划应使用") && ruleNum === 1 && rulez[ruleNum]) {
      targetText = targetText.replace("学前机构应", "计划应");
      targetText = targetText.replace("学前机构还", "计划应");
    }

    if (targetText.includes("For example, I let") && ruleNum === 5 && !rulez[ruleNum]) {
      targetText = targetText.replace("First", "First, <pronoun>");
    }
    if (targetText.includes("For example, I let") && ruleNum === 5 && rulez[ruleNum]) {
      targetText = targetText.replace("First, <pronoun>", "First");
    }

    if (targetText.includes("As a good teacher") && ruleNum === 5 && !rulez[ruleNum]) {
      targetText = targetText.replace("so as to", "so <pronoun>");
    }
    if (targetText.includes("As a good teacher") && ruleNum === 5 && rulez[ruleNum]) {
      targetText = targetText.replace("so <pronoun>", "so as to");
    }

    if (targetText.includes("As a good teacher") && ruleNum === 4 && !rulez[ruleNum]) {
      targetText = targetText.replace("see the students", "see their");
      targetText = targetText.replace("to the students", "to their");
      targetText = targetText.replace("with the students", "with their");
    }
    if (targetText.includes("As a good teacher") && ruleNum === 4 && rulez[ruleNum]) {
      targetText = targetText.replace("see their", "see the students");
      targetText = targetText.replace("to their", "to the students");
      targetText = targetText.replace("with their", "with the students");
    }

    // String.prototype.startsWith(searchString [, length])
    // Determines whether the calling string begins with the characters of string searchString.

    // String.prototype.includes(searchString [, position])
    // Determines whether the calling string contains searchString.

    // String.prototype.indexOf(searchValue [, fromIndex])
    // Returns the index within the calling String object of the first occurrence of searchValue, or -1 if not found.

    // String.prototype.slice(beginIndex[, endIndex])
    // Extracts a section of a string and returns a new string.

    // String.prototype.replace(searchFor, replaceWith)
    // Used to replace occurrences of searchFor using replaceWith.
    // searchFor may be a string or Regular Expression, and replaceWith may be a string or function.

    let cookieTargetText = cookie.load("targetText");
    if (targetText !== cookieTargetText) {
      this.setState( { targetText: targetText });
      cookie.save("targetText", targetText, { path: "/" });
    }

    // Flip active state for the specified rule (change button/state)
    rulez[ruleNum] = !rulesActive[ruleNum];
    this.setState( {rulesActive : rulez});
    let cookieRulesActive = cookie.load("rulesActive");
    if (rulez !== cookieRulesActive) {
      cookie.save("rulesActive", rulez, { path: "/" });
    }
  }

  render() {
    const { uniqueId, languageCodes, sourceLang, targetLang, domain,
      sourceText, targetText, rulesActive, rulesNames, rulesIndices,
      translation, rulesVisible } = this.state;

    cookie.save("uniqueId", uniqueId, { path: "/" });

    return (
      <Box>
      {/* Title */}
      <AppBar>
        <Toolbar>
          <Grid
            justify="space-between"
            container
          >
          <Grid item>
            <Typography variant="h5">
              HIP Domain Translate
            </Typography>
          </Grid>
          <Grid item>
            <Typography variant="h5">
              User ID: {uniqueId}
            </Typography>
          </Grid>
          </Grid>
        </Toolbar>
      </AppBar>

      {/* Body */}
      <Container maxWidth="lg" className="page">
      <Grid container spacing={3}>
        {/* Source Language Section*/}
        <Grid item xs>
          {/* Source Language SELECTION */}
          <FormControl>
          <InputLabel>Translate from</InputLabel>
          <Select
            className="select-sourceLang"
            value={sourceLang}
            onChange={e => this.changeHandlerSource(e.target.value)}
          >
            {languageCodes.map(lang => (
              <MenuItem key={lang.language} value={lang.language}>
                {lang.name}
              </MenuItem>
            ))}
          </Select>
          </FormControl>
          {/* Source Language TEXT */}
          <p></p>
          <FormControl fullWidth>
            <TextField
              id="outlined-multiline-static"
              multiline
              rows="12"
              value={sourceText}
              variant="outlined"
              onChange={e => this.changeHandlerSourceText(e.target.value)}
            />
          </FormControl>

          <p></p>
          <Button variant="contained" color="primary" style={{ float: "right" }} onClick={() => this.translateText()}>Translate!</Button>
        </Grid>

        {/* Target Language Section*/}
        <Grid item xs>

          {/* Target Language SELECTION */}
          <FormControl>
          <InputLabel>Translate to</InputLabel>
          <Select
            className="select-targetLang"
            value={targetLang}
            onChange={e => this.changeHandlerTarget(e.target.value)}
          >
            {languageCodes.map(lang => (
              <MenuItem key={lang.language} value={lang.language}>
                {lang.name}
              </MenuItem>
            ))}
          </Select>
          </FormControl>

          {/* Target Language TEXT */}
          <p></p>
          <FormControl fullWidth>
            <TextField
              id="outlined-multiline-static"
              multiline
              rows="12"
              value={targetText}
              variant="outlined"
              onChange={e => this.changeHandlerTargetText(e.target.value)}
            />
          </FormControl>

          {/* Submit translation button */}
          <p></p>
          <Button variant="contained" color="primary" style={{ float: "right" }} onClick={() => this.putDataToDB(uniqueId, sourceLang, targetLang, sourceText, targetText, domain, translation)}>Done Editing!</Button>
        </Grid>

        {/* Rules Section */}
        <Grid item xs={3}>
          <FormControl>
            <InputLabel>Domain</InputLabel>
            <Select
              className="select-domain"
              value={domain}
              onChange={e => this.changeHandlerDomain(e.target.value)}
            >
              <MenuItem key="edu" value="edu">Education</MenuItem>
            </Select>
          </FormControl>

          <h4>Quick fixes:</h4>
          {rulesIndices.map(ruleI => (
            <Button disabled={!rulesVisible[ruleI]} variant={rulesActive[ruleI] ? "contained" : "outlined"} color="primary" onClick={() => this.toggleRule(ruleI)}>
              {rulesNames[ruleI]}
            </Button>
          ))}
        </Grid>

      </Grid>
      </Container>
      </Box>
    );
  }

  // Update cookies and state when selections/inputs change.
  // 1. Source language
  changeHandlerSource = sourceLang => {
    let cookieSourceLang = cookie.load("sourceLang");
    if (sourceLang !== cookieSourceLang) {
      this.setState({ sourceLang });
      cookie.save("sourceLang", sourceLang, { path: "/" });
    }
  };

  // 2. Target language, also update rules based on this info
  changeHandlerTarget = targetLang => {
    let cookieTargetLang = cookie.load("targetLang");
    if (targetLang !== cookieTargetLang) {
      this.setState({ targetLang });
      cookie.save("targetLang", targetLang, { path: "/" });
    }

    if (targetLang === "en") {
      cookie.save("rulesVisible", [false, false, false, false, true, true], { path: "/" });
      this.setState({ rulesVisible: [false, false, false, false, true, true] });
    }
    if (targetLang === "zh") {
      cookie.save("rulesVisible", [true, true, true, true, false, false], { path: "/" });
      this.setState({ rulesVisible: [true, true, true, true, false, false] });
    }
  };

  // 3. Domain
  changeHandlerDomain = domain => {
    let cookieDomain = cookie.load("domain");
    if (domain !== cookieDomain) {
      this.setState({ domain });
      cookie.save("domain", domain, { path: "/" });
    }
  };

  // 4. Source text
  changeHandlerSourceText = sourceText => {
    let cookieSourceText = cookie.load("sourceText");
    if (sourceText !== cookieSourceText) {
      this.setState({ sourceText });
      cookie.save("sourceText", sourceText, { path: "/" });
    }
  };

  // 5. Target text
  changeHandlerTargetText = targetText => {
    let cookieTargetText = cookie.load("targetText");
    if (targetText !== cookieTargetText) {
      this.setState({ targetText });
      cookie.save("targetText", targetText, { path: "/" });
    }
  };

}

export default App;
