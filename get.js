const fs = require('fs'),
  cheerio = require('cheerio'),
  he = require('he'),
  request = require('request'),
  csv=require('csvtojson')
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

var CsvReadableStream = require('csv-reader');

var inputStream = fs.createReadStream('uri.csv', 'utf8');


let post_author = '6'
let post_parent = '0'
let info = []
const csvWriter = createCsvWriter({
  path: './file.csv',
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


// let username = "MicroFocusPV",
//   password = "Cv3u7PEV",
//   url = "http://nxtv.coding-dev.work",
//   auth = "Basic " + new Buffer.from(username + ":" + password).toString("base64");

csv()
  .fromFile('uri.csv')
  .then((jsonObj) => {
    jsonObj.forEach(ls => {
      let uri = ls.uri
      request({
        url: uri,
        // headers: {
        //   "Authorization": auth
        // }
      }, function (error, response, html) {
        if (!error && response.statusCode == 200) {
          doCheerio(html, uri)
          // console.log(uri);
        }
      })
    })
  })


var doCheerio = function (html,uri) {
  getParentPost(uri)
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
      let page_linklists = getpage_linklists($('.linklist').find('.c-ttl-01').text())

      if(page_linklists != undefined){
        page_linklist = page_linklists.name
      }
    }
  }
  removeACF($)
  let page_content = clsHTML($('.contents').html())
  info.push({
    "post_title": post_title,
    "post_content": page_content,
    "post_name": post_name,
    "post_author": post_author,
    "post_status": '',
    "post_parent": '',
    "wp_page_template": '',
    "post_seo_title": title,
    "post_seo_description": description,
    "post_seo_keyword": keywords,
    "page_mv": page_mv,
    "page_contact_section": page_contact_section,
    "page_linklist": page_linklist
  })

  // let json = JSON.stringify(info); //convert it back to json
  // fs.writeFile('myjsonfile.json', json, 'utf8', function () {}); // write it back
    csvWriter.writeRecords(info)       // returns a promise
    .then(() => {});


}

var clsHTML = function (str) {
  if (str == null) {
    return
  } else {
    return he.decode(str.replace(/  /g, "").replace(/\t/g, "").replace(/\n/g, ""));
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
  let llist = [{
      "name": "about",
      "title": "会社情報"
    },
    {
      "name": "cobol",
      "title": "COBOL製品"
    },
    {
      "name": "enterprise",
      "title": "エンタープライズ製品"
    },
    {
      "name": "devpartner",
      "title": "開発支援ツール"
    },
    {
      "name": "silk",
      "title": "テストツール"
    },
    {
      "name": "change-management",
      "title": "構成・変更管理ツール"
    },
    {
      "name": "corba",
      "title": "分散処理基盤"
    },
    {
      "name": "support",
      "title": "サポート"
    },
    {
      "name": "partners",
      "title": "パートナー"
    },
  ]
  return llist.find(v => list.match(v.title))
}


let getParentPost = (uri) =>{
  // console.log(uri.match(/\.html/));
  if(uri.match(/\.html/)[0] != null){
    // console.log(uri);
// console.log(uri);    // return ''
  }

  // noindex.html


  // /products/COBOL/
  // /products/enterprise/
  // /products/devpartner/
  // /products/silk/
  // /products/change-management/
  // /products/corba/
  // /products/SDT/
  // /products/training/
  // /products/partners/
  // privacy
  // about
}