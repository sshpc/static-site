// 在线Meta元素分析工具 JavaScript逻辑

// DOM元素引用
const metaForm = document.getElementById('metaForm');
const urlInput1 = document.getElementById('urlInput1');
const urlInput2 = document.getElementById('urlInput2');
const analyzeBtn = document.getElementById('analyzeBtn');
const resultSection = document.getElementById('resultSection');
const loading = document.getElementById('loading');
const result = document.getElementById('result');
const metaList = document.getElementById('metaList');
const error = document.getElementById('error');
const errorMessage = document.getElementById('errorMessage');

// CORS代理服务地址
const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

/**
 * 初始化应用
 */
function init() {
    metaForm.addEventListener('submit', handleFormSubmit);
}

/**
 * 处理表单提交
 * @param {Event} e - 表单提交事件
 */
function handleFormSubmit(e) {
    e.preventDefault();
    
    const url1 = urlInput1.value.trim();
    const url2 = urlInput2.value.trim();
    
    // 显示加载状态
    showLoading();
    
    // 根据是否提供了第二个URL来决定分析方式
    if (url2) {
        // 对比分析
        compareMetaTags(url1, url2);
    } else {
        // 单网站分析
        analyzeMetaTags(url1);
    }
}

/**
 * 分析网页Meta标签
 * @param {string} url - 目标网页URL
 */
async function analyzeMetaTags(url) {
    try {
        // 获取网页HTML内容
        const html = await fetchHtmlContent(url);
        
        // 提取Meta标签
        const metaTags = extractMetaTags(html);
        
        // 显示结果
        displayResults(metaTags);
        
    } catch (err) {
        // 显示错误信息
        showError(err.message);
    } finally {
        // 隐藏加载状态
        hideLoading();
    }
}

/**
 * 获取网页HTML内容
 * @param {string} url - 目标网页URL
 * @returns {Promise<string>} - 网页HTML内容
 */
async function fetchHtmlContent(url) {
    // 添加CORS代理前缀
    const proxyUrl = CORS_PROXY + url;
    
    const response = await fetch(proxyUrl, {
        method: 'GET',
        headers: {
            'Content-Type': 'text/plain',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
    });
    
    if (!response.ok) {
        throw new Error(`HTTP错误！状态：${response.status}`);
    }
    
    return await response.text();
}

/**
 * 从HTML中提取所有Meta标签
 * @param {string} html - 网页HTML内容
 * @returns {Array<Object>} - Meta标签数组
 */
function extractMetaTags(html) {
    // 创建临时DOM元素来解析HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // 获取所有Meta标签
    const metaElements = doc.getElementsByTagName('meta');
    const metaTags = [];
    
    // 遍历所有Meta标签，提取属性
    for (let i = 0; i < metaElements.length; i++) {
        const meta = metaElements[i];
        const attributes = {};
        
        // 获取所有属性
        for (let j = 0; j < meta.attributes.length; j++) {
            const attr = meta.attributes[j];
            attributes[attr.name] = attr.value;
        }
        
        metaTags.push(attributes);
    }
    
    return metaTags;
}

/**
 * 显示分析结果
 * @param {Array<Object>} metaTags - Meta标签数组
 */
function displayResults(metaTags) {
    // 清空之前的结果
    metaList.innerHTML = '';
    
    if (metaTags.length === 0) {
        metaList.innerHTML = '<p style="text-align: center; color: #666; padding: 40px;">未找到任何Meta标签</p>';
    } else {
        // 创建Meta标签卡片
        metaTags.forEach((meta, index) => {
            const metaCard = createMetaCard(meta, index);
            metaList.appendChild(metaCard);
        });
    }
    
    // 显示结果，隐藏错误
    result.style.display = 'block';
    error.style.display = 'none';
}

/**
 * 创建Meta标签卡片
 * @param {Object} meta - Meta标签属性
 * @param {number} index - 索引
 * @param {string} className - 额外的CSS类名
 * @returns {HTMLElement} - 卡片元素
 */
function createMetaCard(meta, index, className = '') {
    const card = document.createElement('div');
    card.className = `meta-item ${className}`;
    
    // 创建属性列表
    const propertiesList = document.createElement('ul');
    propertiesList.className = 'meta-properties';
    
    // 添加所有属性
    for (const [key, value] of Object.entries(meta)) {
        const propertyItem = document.createElement('li');
        
        const propertyKey = document.createElement('span');
        propertyKey.className = 'meta-key';
        propertyKey.textContent = key;
        
        const propertyValue = document.createElement('span');
        propertyValue.className = 'meta-value';
        propertyValue.textContent = value;
        
        propertyItem.appendChild(propertyKey);
        propertyItem.appendChild(propertyValue);
        propertiesList.appendChild(propertyItem);
    }
    
    card.appendChild(propertiesList);
    return card;
}

/**
 * 创建占位Meta标签卡片
 * @param {string} name - Meta标签名称
 * @returns {HTMLElement} - 占位卡片元素
 */
function createPlaceholderCard(name) {
    const card = document.createElement('div');
    card.className = 'meta-item different placeholder';
    
    // 创建属性列表
    const propertiesList = document.createElement('ul');
    propertiesList.className = 'meta-properties';
    
    // 添加name属性
    const nameItem = document.createElement('li');
    const nameKey = document.createElement('span');
    nameKey.className = 'meta-key';
    nameKey.textContent = 'name';
    const nameValue = document.createElement('span');
    nameValue.className = 'meta-value';
    nameValue.textContent = name;
    nameItem.appendChild(nameKey);
    nameItem.appendChild(nameValue);
    propertiesList.appendChild(nameItem);
    
    // 添加占位提示
    const placeholderItem = document.createElement('li');
    const placeholderKey = document.createElement('span');
    placeholderKey.className = 'meta-key';
    placeholderKey.textContent = '提示';
    const placeholderValue = document.createElement('span');
    placeholderValue.className = 'meta-value';
    placeholderValue.textContent = '该Meta标签不存在';
    placeholderItem.appendChild(placeholderKey);
    placeholderItem.appendChild(placeholderValue);
    propertiesList.appendChild(placeholderItem);
    
    card.appendChild(propertiesList);
    return card;
}

/**
 * 显示加载状态
 */
function showLoading() {
    loading.style.display = 'block';
    result.style.display = 'none';
    error.style.display = 'none';
    analyzeBtn.disabled = true;
    analyzeBtn.textContent = '分析中...';
}

/**
 * 隐藏加载状态
 */
function hideLoading() {
    loading.style.display = 'none';
    analyzeBtn.disabled = false;
    analyzeBtn.textContent = '分析Meta标签';
}

/**
 * 比较两个网站的Meta标签
 * @param {string} url1 - 第一个网页URL
 * @param {string} url2 - 第二个网页URL
 */
async function compareMetaTags(url1, url2) {
    try {
        // 并行获取两个网站的HTML内容
        const [html1, html2] = await Promise.all([
            fetchHtmlContent(url1),
            fetchHtmlContent(url2)
        ]);
        
        // 提取Meta标签
        const metaTags1 = extractMetaTags(html1);
        const metaTags2 = extractMetaTags(html2);
        
        // 显示对比结果
        displayCompareResults(metaTags1, metaTags2, url1, url2);
        
    } catch (err) {
        // 显示错误信息
        showError(err.message);
    } finally {
        // 隐藏加载状态
        hideLoading();
    }
}

/**
 * 比较两个Meta标签是否相同
 * @param {Object} meta1 - 第一个Meta标签
 * @param {Object} meta2 - 第二个Meta标签
 * @returns {boolean} - 是否相同
 */
function areMetaTagsEqual(meta1, meta2) {
    // 检查属性数量是否相同
    const keys1 = Object.keys(meta1);
    const keys2 = Object.keys(meta2);
    
    if (keys1.length !== keys2.length) {
        return false;
    }
    
    // 检查所有属性是否相同
    for (const key of keys1) {
        if (meta1[key] !== meta2[key]) {
            return false;
        }
    }
    
    return true;
}

/**
 * 显示对比结果
 * @param {Array<Object>} metaTags1 - 第一个网站的Meta标签数组
 * @param {Array<Object>} metaTags2 - 第二个网站的Meta标签数组
 * @param {string} url1 - 第一个网站的URL
 * @param {string} url2 - 第二个网站的URL
 */
function displayCompareResults(metaTags1, metaTags2, url1, url2) {
    // 清空之前的结果
    metaList.innerHTML = '';
    
    // 显示对比结果标题
    const title = document.createElement('h3');
    title.textContent = `Meta标签对比结果: ${url1} vs ${url2}`;
    metaList.appendChild(title);
    
    // 创建对比容器
    const compareContainer = document.createElement('div');
    compareContainer.className = 'compare-container';
    
    // 创建第一个网站的结果列
    const column1 = document.createElement('div');
    column1.className = 'compare-column';
    const column1Title = document.createElement('h4');
    column1Title.textContent = url1;
    column1.appendChild(column1Title);
    
    // 创建第二个网站的结果列
    const column2 = document.createElement('div');
    column2.className = 'compare-column';
    const column2Title = document.createElement('h4');
    column2Title.textContent = url2;
    column2.appendChild(column2Title);
    
    // 收集所有meta标签的name属性
    const allNames = new Set();
    
    // 收集第一个网站的name属性
    metaTags1.forEach(meta => {
        if (meta.name) {
            allNames.add(meta.name);
        }
    });
    
    // 收集第二个网站的name属性
    metaTags2.forEach(meta => {
        if (meta.name) {
            allNames.add(meta.name);
        }
    });
    
    // 转换为数组并排序
    const sortedNames = Array.from(allNames).sort();
    
    // 处理每个name属性
    sortedNames.forEach((name, index) => {
        // 查找两个网站中具有相同name的meta标签
        const meta1 = metaTags1.find(meta => meta.name === name);
        const meta2 = metaTags2.find(meta => meta.name === name);
        
        // 检查两个meta标签是否完全相同
        const areSame = meta1 && meta2 && areMetaTagsEqual(meta1, meta2);
        
        // 为第一个网站创建卡片
        if (meta1) {
            // 存在则创建正常卡片
            const card1 = createMetaCard(meta1, index, areSame ? 'same' : 'different');
            column1.appendChild(card1);
        } else {
            // 不存在则创建占位卡片
            const placeholder1 = createPlaceholderCard(name);
            column1.appendChild(placeholder1);
        }
        
        // 为第二个网站创建卡片
        if (meta2) {
            // 存在则创建正常卡片
            const card2 = createMetaCard(meta2, index, areSame ? 'same' : 'different');
            column2.appendChild(card2);
        } else {
            // 不存在则创建占位卡片
            const placeholder2 = createPlaceholderCard(name);
            column2.appendChild(placeholder2);
        }
    });
    
    // 添加到对比容器
    compareContainer.appendChild(column1);
    compareContainer.appendChild(column2);
    metaList.appendChild(compareContainer);
    
    // 显示结果，隐藏错误
    result.style.display = 'block';
    error.style.display = 'none';
}

/**
 * 显示错误信息
 * @param {string} message - 错误信息
 */
function showError(message) {
    errorMessage.textContent = message;
    error.style.display = 'block';
    result.style.display = 'none';
}

// 初始化应用
document.addEventListener('DOMContentLoaded', init);