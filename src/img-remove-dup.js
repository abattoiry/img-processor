#!/usr/bin/env node
/* eslint-disable */
const Util = require('./utils/util');
const imgCompare = require('./img-compare');
const scanImageRefs = require('./utils/scan-image-refs');
const config = require('./utils/config');

async function run() {
  // 获取图片对比列表
  const sameImgGroups = await imgCompare();
  // 查找所有文件里面的img链接
  scanImageRefs(remove);

  /**
   * scanImageRefs的回调，不是每个链接回调，而是每个文件回调
   *
   * @param {*} imgData 一个文件中多个图片的原始链接和处理后链接
   * @param {*} file 文件名称
   * @param {*} content 文件内容
   */
  function remove(imgData, file, content) {
    let writeImgs = [];
    // 遍历所有的相似图片组
    sameImgGroups.forEach((group) => {
      // 所有路径都修改成相似图片组里第一张
      // 此处可以改为最短的一个路径
      const replaceImg = group[0];
      // 遍历一个组里面的图片
      group.forEach((sameImg) => {
        // 遍历要写入文件里面所有的图片路径
        imgData.imgs.forEach((imgPath, index) => {
          if (sameImg === imgPath) {
            imgPath = replaceImg;
            writeImgs.push({
              current: imgPath,
              original: imgData.originalImgs[index]
            })
          }
        })
      })
    })
    writeImgs.forEach((img) => {
      if (config.imgPathType !== 'absolute') {
        img.current = Util.getRelativePathOfFile(file, img.current);
      } else {
        img.current = Util.getAbsolutePath(img.current);
      }
    })
    Util.replaceContent(writeImgs, file, content);
  }
}

module.exports = run;