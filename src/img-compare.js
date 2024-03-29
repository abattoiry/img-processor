#!/usr/bin/env node
/* eslint-disable */
const { compare } = require('resemblejs');
const fs = require('fs');
const glob = require('glob');
const config = require('./utils/config');
const Util = require('./utils/util');
const processing = new (require('@hb/node-processing'));

/*
  compareThreshold有两个作用：
  1. 图片区别率在这个值以下的为相似图片
  2. 当计算图片区别率时，超过这个值就不再计算了，可以极大的提高效率
  默认为5
*/
const compareThreshold = config.compareThreshold + 1;

const options = {
  scaleToSameSize: false,
  ignore: null,
  returnEarlyThreshold: compareThreshold,
};

function imgCompare(img1, img2) {
  return new Promise((resolve, reject) => {
    compare(
      fs.readFileSync(img1),
      fs.readFileSync(img2),
      options, (err, data) => {
        if (err) {
          console.log('resemble compare error', err);
          reject(err);
        } else {
          resolve(data);
        }
      }
    )
  });
}

function run() {
  return new Promise((resolve, reject) => {
    processing.startWithCluster(compare);
    // 所有相似图片组
    const imgArrs = [];
    async function compare() {
      let files;
      // 获取图片路径
      try {
        files = await new Promise((resolve, reject) => {
          glob(`${config.compareDir}!(node_modules)/**/*.png`, (err, data) => {
            if (err) {
              reject(err);
            }
            resolve(data);
          })
        })
      } catch (err) {
        console.log('glob error', err);
        return;
      }
      let item, flag;
      do {
        flag = true;
        const arr = []; // 一组相似图片
        // 用来做对比的图片提取出来删除掉
        item = files.shift();
        for (let i = 0; i < files.length; i++) {
          let _item = files[i];
          try {
            let res = await imgCompare(item, _item);
            if (res.rawMisMatchPercentage < compareThreshold) {
              if (flag) {
                arr.push(Util.getProjectAbsolutePath(item));
                imgArrs.push(arr);
                flag = false;
              }
              _item = Util.getProjectAbsolutePath(_item);
              arr.push(_item);
              // 对比过相似的图片删除掉
              files.splice(i, 1);
              i--;
            }
          } catch (err) {
            console.log('resemble compare error', err);
          }
        }
        if (arr.length > 0) {
          console.log(arr);
          console.log('========================================')
        }
      } while (item);
      console.log(`一共存在\x1B[31m${imgArrs.length}\u001b[39m组相似图片`);
      processing.finish();
      resolve(imgArrs);
    }
  })
}

module.exports = run;
