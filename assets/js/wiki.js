// Article limits, constant for now but TODO selection:
const historyLimit = 40;
const articleLimit = 20;


function initPage() {
  // Initialize history and date picker:
  displayFavourites();
  setYesterDate();
  getArticles();
}

function getArticles() {
  // Fetch most popular pages for the selected date:
  let date = getDate();
  let api = `https://wikimedia.org/api/rest_v1/metrics/pageviews/top/en.wikipedia/all-access/${date[0]}/${date[1]}/${date[2]}`;

  fetch(api)
    .then(response => response.json())
    .then(json => addArticles(json))
    .catch(err => console.log('Request Failed', err));
}

function addArticles(jdata) {
  // Display popular articles.
  let lst = document.getElementById("wiki-articles");
  lst.innerHTML = "";
  let arts = jdata.items[0].articles;
  let ok = 0;

  for(let i = 0; i < 100; i++) {
    if(arts[i]) {
      let art = arts[i].article;
      // Excluding the main page and special pages (especially Special:Search, which always shows up on popular).
      if(art == "Main_Page" || art.includes("Special:") || art.includes("Wikipedia:"))
        continue;

      lst.innerHTML += `<li value="${art}" onclick="displayExcerpt(this)">${art.replaceAll('_', ' ')}</li>\n`;
      //TODO: We could also show views for each article?
      ok++;
    }
    // We only show a limited number of articles, there's a lot otherwise.
    if(ok >= articleLimit) //TODO: Maybe allow selecting the limit?
      break;
  }
}

function displayExcerpt(article) {
  // Display the selected article.
  let name = article.getAttribute('value');
  //console.log(name);
  document.getElementById("select-heading").innerHTML = name.replaceAll('_', ' ');
  document.getElementById("select-article").innerHTML = "Loading...";
  setFavourites(name); // Add to history.

  name = name.replace('&', '%26'); // This could mess up our GETs.
  //let api = `https://en.wikipedia.org/w/api.php?origin=*&format=json&action=query&prop=extracts&exintro&explaintext&redirects=1&titles=${name}`;
  let api = `https://en.wikipedia.org/w/api.php?origin=*&format=json&action=query&prop=extracts&exintro=1&redirects=1&titles=${name}`;

  fetch(api)
    .then(response => response.json())
    .then(json => addText(json))
    .catch(err => console.log('Request Failed', err));
}

function addText(jdata) {
  // Display the text of the article:
  let art = document.getElementById("select-article");
  let txt = jdata.query.pages;
  // We're doing this because the article text in JSON is keyed by its ID, which we don't know.
  for(var excerpt in txt) {
    art.innerHTML = txt[excerpt].extract;
    break; // There should always only be one key.
  }
}

function setYesterDate() {
  // Today statistics are not yet finished, so we always start with yesterday.
  let today = new Date();
  let yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  // Extract year, month and day as numbers:
  var year = today.getFullYear();
  var month = today.getMonth()+1;
  // We always want month and day to have to numbers, so add 0 where necessary:
  if(month < 10)
    month = '0'+month;
  var day = today.getDate()-1;
  if(day < 10)
    day = '0'+day;
  //console.log(`Fetching for: ${year} ${month} ${day}`);

  // Set default value of the date picker:
  document.getElementById("datePicker").value = `${year}-${month}-${day}`;
}

function getDate() {
  // Read set date from the date picker:
  let data = document.getElementById("datePicker").value;

  //TODO some message when we refuse?
  // This happens when somebody deletes the contents of the date picker and tries to submit.
  if(data == "") {
    setYesterDate();
    alert("Popular page statistics are not available for today or the future, so a past date has to be selected."); // It's crude, but works for now...
    return getDate();
  }
  // Also don't let the user submit today:
  let today = new Date();
  let now = new Date(data + " 23:59:59"); // The time is there to make sure the comparison properly works for today.
  if(now >= today) {
    setYesterDate();
    alert("Popular page statistics are not available for today or the future, so a past date has to be selected.");
    return getDate();
  }

  // Return array [year, month, day].
  return data.split("-");
}

function setFavourites(newArt) {
  // Add a new article to history, rearranging the array to have the last added article on top.
  let favour = localStorage.getItem("wikiFavourites");

  if(favour) {
    // Found history, parse it:
    favour = JSON.parse(favour);
    // Move the new article to front, plus if it already exists in history, remove it.
    if(!favour.includes(newArt))
      favour.unshift(newArt);
    else {
      favour = favour.filter(word => word != newArt);
      favour.unshift(newArt);
    }

    localStorage.setItem("wikiFavourites", JSON.stringify(favour));
  } else {
    // No history exists, create a new one:
    localStorage.setItem("wikiFavourites", JSON.stringify([newArt]));
  }
  displayFavourites();
}

function resetFavourites() {
  // This deletes the saved history of articles.
  if(confirm("Do you really want to delete your history of articles?")) {
    localStorage.removeItem("wikiFavourites");
    displayFavourites();
  }
}

function displayFavourites() {
  // Get article history and display it.
  let favour = localStorage.getItem("wikiFavourites");
  let lst = document.getElementById("favour-articles");
  lst.innerHTML = "";

  if(favour) {
    // Found some history, parse it and construct a list:
    favour = JSON.parse(favour);
    for(let i = 0; i < favour.length && i < historyLimit; i++) { // Only show a number of articles up to historyLimit.
      let art = favour[i];
      lst.innerHTML += `<li value="${art}" onclick="displayExcerpt(this)">${art.replaceAll('_', ' ')}</li>\n`;
    }
    // If we had previously hidden the "Delete History" button, show it:
    document.getElementById("deleteHistory").style.display = "block";
  } else { // Found no history.
    // Hide "Delete History" button when there is no history on record.
    document.getElementById("deleteHistory").style.display = "none";
  }
}
