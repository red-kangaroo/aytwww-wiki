var test;


function getArticles() {
  displayFavourites();
  let date = getProperDate();
  
  // TODO: also select language?
  let api = `https://wikimedia.org/api/rest_v1/metrics/pageviews/top/en.wikipedia/all-access/${date[0]}/${date[1]}/${date[2]}`;

  fetch(api)
    .then(response => response.json())
    .then(json => addArticles(json))
    .catch(err => console.log('Request Failed', err));
}

function addArticles(jdata) {
  let lst = document.getElementById("wiki-articles");
  lst.innerHTML = "";
  let arts = jdata.items[0].articles;
  let limit = 10; // TODO: add picker how many, base 10
  let ok = 0;

  for(let i = 0; i < 100; i++) {
    if(arts[i]) {
      let art = arts[i].article;
      if(art == "Main_Page" || art.includes("Special:")) // Excluding the main page and special pages (especially Special:Search).
        continue;
      
      lst.innerHTML += `<li value="${art}" onclick="displayExcerpt(this)">${art.replaceAll('_', ' ')}</li>\n`;
      //TODO: show views?
      ok++;
    }
    if(ok >= limit)
      break;
  }
}

function displayExcerpt(article) {
  let name = article.getAttribute('value');
  document.getElementById("select-heading").innerHTML = name.replaceAll('_', ' ');
  setFavourites(name);
  //let api = `https://en.wikipedia.org/w/api.php?origin=*&format=json&action=query&prop=extracts&exintro&explaintext&redirects=1&titles=${name}`;
  let api = `https://en.wikipedia.org/w/api.php?origin=*&format=json&action=query&prop=extracts&exintro=1&redirects=1&titles=${name}`;
  
  fetch(api)
    .then(response => response.json())
    .then(json => addText(json))
    .catch(err => console.log('Request Failed', err));
}

function addText(jdata) {
  let art = document.getElementById("select-article");
  let txt = jdata.query.pages;
  for(var excerpt in txt) {
    art.innerHTML = txt[excerpt].extract;
    break; // There should only be one key in pages, but we don't know that key.
  }
}

function getProperDate() {
  // TODO We want to pre-fill date picker with today, but for now.

  // We actually need yesterday:
  let today = new Date();
  let yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  var year = today.getFullYear();
  var month = today.getMonth()+1;
  if(month < 10)
    month = '0'+month;
  var day = today.getDate()-1;
  if(day < 10)
    day = '0'+day;
  console.log(`Fetching for: ${year} ${month} ${day}`);

  return [year, month, day];
}

function setFavourites(newArt) {
  let favour = localStorage.getItem("wikiFavourites");
  if(favour) {
    favour = JSON.parse(favour);
    console.log(favour);
    if(!favour.includes(newArt))
      favour.push(newArt);
    console.log(favour);

    localStorage.setItem("wikiFavourites", JSON.stringify(favour));
  } else {
    localStorage.setItem("wikiFavourites", JSON.stringify([newArt]));
  }
  displayFavourites();
}

function resetFavourites() {
  if(confirm("Do you really want to delete your history of articles?")) {
    localStorage.removeItem("wikiFavourites");
    displayFavourites();
  }
}

function displayFavourites() {
  let favour = localStorage.getItem("wikiFavourites");
  let lst = document.getElementById("favour-articles");
  lst.innerHTML = "";
 
  if(favour) {
    favour = JSON.parse(favour);
    for(let i = 0; i < favour.length; i++) {
      let art = favour[i];
      lst.innerHTML += `<li value="${art}" onclick="displayExcerpt(this)">${art.replaceAll('_', ' ')}</li>\n`;
    }
  }
}
