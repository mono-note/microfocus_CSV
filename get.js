const fs = require('fs'),
  cheerio = require('cheerio'),
  he = require('he'),
  request = require('request'),
  requestp = require('request-promise'),
  csv=require('csvtojson'),
  csvjson = require('csvjson'),
  CsvReadableStream = require('csv-reader'),
  createCsvWriter = require('csv-writer').createObjectCsvWriter;

const csvFilePath = 'uri.csv'
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
var data = fs.readFileSync(csvFilePath, { encoding : 'utf8'});
var options = {
  delimiter : ',', // optional
  quote     : '"' // optional
};

const csvUri = csvjson.toObject(data, options).map(d => d.uri);

const isAuth = true;

if (isAuth) {
  let errMsg = ''
  const promises = csvUri.map(url => requestp({
    uri: url,
    method: 'GET',
    auth: {
      'user': 'MicroFocusPV',
      'pass': 'Cv3u7PEV'
    }
  }).catch(err => {
    errMsg = err.options.uri;
    return ''
  }));
  Promise.all(promises).then((data) => {
    data.forEach((valHTML, idx) => {
      doCheerio(valHTML, csvUri[idx])
    })
  }).then(()=> csvWriter.writeRecords(info))
}else{
  const promises = csvUri.map(url => requestp(url).catch(err => {
    errMsg = err.options.uri;
    return ''
  }));
  Promise.all(promises).then((data) => {
    data.forEach((valHTML, idx) => {
      doCheerio(valHTML, csvUri[idx])
    })
  }).then(()=> csvWriter.writeRecords(info))
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


  info.push({
    "post_title": post_title,
    "post_content": page_content,
    "post_name": post_name,
    "post_author": post_author,
    "post_status": '',
    "post_parent": getParentPost(uri),
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
  return llist.find(v => list.match(v.title)).name
}


let getParentPost = (uri) =>{
  let id_parents = [{
    "name": "about",
    "id": 139
  },
  {
    "name": "privacy",
    "id": 641
  },
  {
    "name": "products",
    "id":2
  },
  {
    "name": "products/cobol",
    "id":16
  },
  {
    "name": "products/cobol/visualcobol",
    "id":458
  },
  {
    "name": "products/cobol/whitepaper",
    "id":500
  },
  {
    "name": "products/cobol/cases-2",
    "id":1039
  },
  {
    "name": "enterprise",
    "id": 3
  },
  {
    "name": "devpartner",
    "id": 4
  },
  {
    "name": "silk",
    "id": 5
  },
  {
    "name": "change-management",
    "id": 6
  },
  {
    "name": "corba",
    "id": 7
  },
  {
    "name": "support",
    "id":8
  },
  {
    "name": "partners",
    "id": 9
  },
]

  let pathURI = uri.split('/')[3]
  if(uri.match(/\.html/)[0] != null){
  }
  if(pathURI!= 'products' && uri.split('/').length >5){
    if(uri.match('/about/') != null){                       return 139
    }else if(uri.match('/privacy/') != null){               return 641
    }else if(uri.match('/support/') != null){               return 944
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
    console.log(uri);
      // return 14
    }
  }else{
    return
  }
}