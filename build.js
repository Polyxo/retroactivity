/*Generate static files for deploying / run*/
var sass = require('node-sass');
var Promise = require('promise');
var fs = require('fs');
var ipc = require('electron').ipcMain;
var path = require('path');
sass.renderPromised = Promise.denodeify(sass.render);
fs.writeFilePromised = Promise.denodeify(fs.writeFile);

var webContents = [];

Object.defineProperty(webContents, 'add', { value:function(item)
{
  var that = this;
  this.push(item);
  
  item.watches = [];
  item.cssFiles.forEach(function(cssFile)
  {
    cssFile = path.resolve(cssFile);

    compileMap.forEach(function(options)
    {
      var outFile = path.resolve(options.outFile);
      if(outFile == cssFile)
      {
        console.log("Setting watch on", options.file);
        //FIXME: had to set watch on folder instead of file because of https://github.com/nodejs/node-v0.x-archive/issues/3172
        item.watches.push(fs.watch(path.dirname(options.file), onCSSFileChanged.bind(null, options.file, item)));
      }
    });
  });
  
  if(item.htmlFiles)
  {
    item.htmlFiles.forEach(function(htmlFile)
    {
      console.log("Setting watch on", htmlFile);
      //FIXME: had to set watch on folder instead of file because of https://github.com/nodejs/node-v0.x-archive/issues/3172
      item.watches.push(fs.watch(path.dirname(htmlFile), onHTMLFileChanged.bind(null, item.webContent, item)));
    });
  }
  
  if(!item.destroyHandler)
    item.destroyHandler = item.webContent.once('destroyed', this.remove.bind(this, item));
}});

Object.defineProperty(webContents, 'remove', { value:function(item)
{
  var indexToRemove = this.indexOf(item);
  if(indexToRemove > 0)
    this.splice(indexToRemove, 1);
  
  item.watches.forEach(function(watch)
  {
    console.log("Closing watch on", item.cssFiles);
    watch.close();
  });
  
  delete item.watches;
}});

var compileMap = [];

Object.defineProperty(compileMap, 'findByProperty', {value:function(prop, value)
{
  return this.filter(function(item) { return item[prop] == value; })[0];
}});

Object.defineProperty(compileMap, 'add', {value:function(items)
{
  if(!(items instanceof Array))
    items = [ items ];
  
  this.push.apply(this, items
    .map(function(item)
    {
      item.file = path.resolve(item.file);
      item.outFile = path.resolve(item.outFile);
      return item;
    }));
  
  return this;
}});

Object.defineProperty(compileMap, 'compile', { value:function(scssPath, options)
{
  if(!options)
  {
    options = Object.assign({}, compileMap.findByProperty('file', path.resolve(scssPath)));
  }
  if(!options)
  {
    throw new Error('No options argument given to renderCSS() and not found in compile map.');
  }
  
  options.file = path.resolve(scssPath);
  
  console.log("render", scssPath, "with options", options);
  
  return sass.renderPromised(options).then(function(result)
  {
    //console.log(result);
    return fs.writeFilePromised(options.outFile, result.css);
  });
}});

Object.defineProperty(compileMap, 'compileAll', { value:function()
{
  return Promise.all(this.map(function(options)
  {
    return compileMap.compile(options.file);
  }));
}});

Object.defineProperty(compileMap, 'watch', { value:function()
{
  ipc.on('css-files', function(event, cssFiles)
  {
    cssFiles = cssFiles
      .filter(function(cssFile) { return cssFile.substr(0, 7) == 'file://'; }) //only compile local files
      .map(function(cssFile) { return cssFile.substr(7); });
    
    var htmlFile = event.sender.getURL().substr(7); //FIXME: check protocol
    
    webContents.add(
    {
      webContent: event.sender,
      cssFiles: cssFiles,
      htmlFiles: [ htmlFile ]
    });
  });
  
  return this;
}});

function onHTMLFileChanged(filename, target)
{
  webContents.remove(target);
  target.webContent.reload();
}

function onCSSFileChanged(filename)
{
   filename = path.resolve(filename);
   
   console.log("CSS file changed", filename);
   
   var options = compileMap.findByProperty('file', filename);
   
   //fix race condition by disallowing concurrent compilations
   if(options && !options.compiling)
   {
     options.compiling = true;
     compileMap.compile(filename)
       .then(function()
       {
         options.compiling = false;
         
         //console.log("Trying to find", filename, "in", compileMap);
         webContents
           .filter(function(item)
           {
             return item.cssFiles.indexOf(options.outFile) != -1;
           })
           .forEach(function(item)
           {
             console.log("reloading", options.outFile);
             item.webContent.send('reload-css', options.outFile);
           });
       }).catch(function(e)
       {
         console.log("Error re-rendering SCSS: ", e);
       });
   }
}

module.exports = exports = compileMap;
