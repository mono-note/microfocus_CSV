const fs = require('fs'),
  cheerio = require('cheerio'),
  he = require('he'),
  requestp = require('request-promise'),
  csvjson = require('csvjson'),
  csvWriter = require('csv-writer');
let linklist_json = require('./json/linklist.json');

const csvFilePath = 'uri.csv';
let post_author = '6',
 post_status = '',
 wp_page_template = '';
let info = [];
let outputCSV = './file.csv'
const csvObject = csvWriter.createObjectCsvWriter({
  path: outputCSV,
  header: [
    {id: 'post_title', title: 'post_title'},
    {id: 'post_content', title: 'post_content'},
    {id: 'post_name', title: 'post_name'},
    {id: 'post_author', title: 'post_author'},
    {id: 'post_status', title: 'post_status'},
    {id: 'post_parent', title: 'post_parent'},
    {id: 'wp_page_template', title: 'wp_page_template'},
    {id: 'post_seo_title', title: 'post_seo_title'},
    {id: 'post_seo_description', title: 'post_seo_description'},
    {id: 'post_seo_keyword', title: 'post_seo_keyword'},
    {id: 'page_mv', title: 'page_mv'},
    {id: 'page_contact_section', title: 'page_contact_section'},
    {id: 'page_linklist', title: 'page_linklist'}
  ]
});
var data = fs.readFileSync(csvFilePath, { encoding : 'utf8'});
var options = {
  delimiter : ',', // optional
  quote     : '"' // optional
};

const csvUri = csvjson.toObject(data, options).map(d => d.uri.replace(/ +/g,''));

const isAuth = true;
const profile = {
  host:"http://nxtv.coding-dev.work",
  username:"MicroFocusPV",
  password:"Cv3u7PEV"
}
if (isAuth) {
  let errMsg = ''
  const promises = csvUri.map(url => requestp({
    uri: url,
    method: 'GET',
    auth: {
      'user': profile.username,
      'pass': profile.password
    }
  }).catch(err => {
    errMsg = err.options.uri;
    return ''
  }));
  Promise.all(promises).then((data) => {
    data.forEach((valHTML, idx) => {
      doCheerio(valHTML, csvUri[idx])
    })
  }).then(()=> csvObject.writeRecords(info))
}else{
  const promises = csvUri.map(url => requestp(url).catch(err => {
    errMsg = err.options.uri;
    return ''
  }));
  Promise.all(promises).then((data) => {
    data.forEach((valHTML, idx) => {
      doCheerio(valHTML, csvUri[idx])
    })
  }).then(()=> csvObject.writeRecords(info))
}

var doCheerio = function (html,uri) {
  const $ = cheerio.load(html);

  let post_title = clsHTML($('h1.heading').html())
  let title = $('title').text()
  let keywords = $('meta[name="keywords"]').attr('content')
  let description = $('meta[name="description"]').attr('content')
  let getslug = uri.split('/')
  let post_name = getslug[getslug.length - 2]
  let page_mv = '',
    page_contact_section = '',
    page_linklist = ''
  if ($('.c-mainvisual').length != 0) {
    page_mv = getPage_mv($('.c-mainvisual').attr('class'))
  }

  if ($('.c-sec-contact').length != 0) {
    page_contact_section = getPage_contact($('.c-sec-contact').find('.row').children())
  }
  if ($('.linklist').length != 0) {
    if ($('.linklist').find('.c-ttl-01').length != 0) {
      page_linklist = getpage_linklists($('.linklist').find('.c-ttl-01').text())
    }
  }

  removeACF($)

  let page_content = clsHTML($('.contents').html())
  if(uri.split('/').length <5){
    if(uri.replace(profile.host,'') == '/index.html'){
      info.push({
        "post_title": '',
        "post_content": page_content,
        "post_name": '',
        "post_author": post_author,
        "post_status": post_status,
        "post_parent": '',
        "wp_page_template": wp_page_template,
        "post_seo_title": title,
        "post_seo_description": description,
        "post_seo_keyword": keywords,
        "page_mv": '',
        "page_contact_section": page_contact_section,
        "page_linklist": page_linklist
      })
    }
  }else{
    info.push({
      "post_title": post_title,
      "post_content": page_content,
      "post_name": post_name,
      "post_author": post_author,
      "post_status": post_status,
      "post_parent": getParentPost(uri),
      "wp_page_template": wp_page_template,
      "post_seo_title": title,
      "post_seo_description": description,
      "post_seo_keyword": keywords,
      "page_mv": page_mv,
      "page_contact_section": page_contact_section,
      "page_linklist": page_linklist
    })
  }
}

// global function

var clsHTML = function (str) {
  if (str == null) {
    return
  } else {
    return he.decode(str.replace(/\t/g, "").replace(/\n/g, "").replace(/ +</g,'<').replace(/> +/g,'>'));
  }
}
var removeACF = function ($) {
  $('.c-mainvisual').remove();
  $('.c-sec-contact').remove();
  $('.linklist').remove();
}
var getPage_mv = function (page_mv) {
  if (page_mv.match(/-about/g) != null) {
    return 'about'
  } else if (page_mv.match(/-products/g) != null) {
    return 'cobol'
  } else if (page_mv.match(/-enterprise/g) != null) {
    return 'enterprise'
  } else if (page_mv.match(/-devpartner/g) != null) {
    return 'devpartner'
  } else if (page_mv.match(/-silk/g) != null) {
    return 'silk'
  } else if (page_mv.match(/-change_management/g) != null) {
    return 'change-management'
  } else if (page_mv.match(/-corba/g) != null) {
    return 'corba'
  } else {
    return 'other'
  }
}
var getPage_contact = function (sec) {
  if (sec.length == 1) {
    return 'cv-1'
  } else if (sec.length == 2) {
    return 'cv-2'
  } else if (sec.length == 3) {
    return 'cv-3'
  } else {
    return '0'
  }
}

var getpage_linklists = function (list) {
  return linklist_json.find(v => list.match(v.title)).name
}

let getParentPost = (uri) =>{
  let pathURI = uri.split('/')[3]
  if(uri.match(/\.html/)[0] != null){
  }
  if(pathURI!= 'products' && uri.split('/').length >5){
    if(uri.match('/about/') != null){                         return 139
    }else if(uri.match('/privacy/') != null){                 return 641
    }else if(uri.match('/support/') != null){                 return 944
    }
  }else if (pathURI == 'products' ){
    if(uri.split('/').length >6){
      if(uri.match('/COBOL/') != null){                       return 16
      }else if(uri.match('/enterprise/') != null){            return 78
      }else if(uri.match('/devpartner/') != null){            return 80
      }else if(uri.match('/silk/') != null){                  return 82
      }else if(uri.match('/change-management/') != null){     return 604
      }else if(uri.match('/SDT/') != null){                   return 379
      }else if(uri.match('/training/') != null){
      }else if(uri.match('/partners/') != null){              return 385
      }else if(uri.match('/corba/') != null){                 return 376
      }
    }else {
      return 14;
    }
  }else{
    return
  }
}