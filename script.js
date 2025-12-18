// ==========================================
// GLOBAL APP SWITCHER
// ==========================================
function switchApp(appName) {
    document.querySelectorAll('.switch-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    document.querySelectorAll('.view-container').forEach(div => div.classList.remove('active'));
    document.getElementById(`view-${appName}`).classList.add('active');
}

// ==========================================
// PART 1: LINK SYSTEM LOGIC (CSV)
// ==========================================
const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTzZiVeEVnkYTU4TR2QQxNxOL6R-xEgrAloqMrJ0VtAuaXzu30qMLodfO33vON0r6gxIQ1CSpzUb5PB/pub?output=csv";
let linkData = {};
let currentLinkMain = "";

async function initLinks() {
    try {
        // credentials: 'omit' ဆိုတာ "ကွတ်ကီးတွေ မမှတ်ပါနဲ့" လို့ ပြောတာပါ
        const res = await fetch(CSV_URL, { credentials: 'omit' });
        if(!res.ok) throw new Error("Connection Failed");
        const text = await res.text();
        parseCSV(text);
        document.getElementById('loading-links').style.display = 'none';
        renderMainTabs();
    } catch (e) {
        document.getElementById('loading-links').innerText = "Link Data Error: " + e.message;
    }
}

function parseCSV(csvText) {
    const rows = csvText.split('\n');
    for(let i=1; i<rows.length; i++) {
        const cols = rows[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.replace(/^"|"$/g, '').trim());
        const [main, sub, topic, name, url] = cols;
        if(!main || !url) continue;

        if(!linkData[main]) linkData[main] = {};
        if(!linkData[main][sub]) linkData[main][sub] = {};
        if(!linkData[main][sub][topic]) linkData[main][sub][topic] = [];
        linkData[main][sub][topic].push({ name, url });
    }
}

function renderMainTabs() {
    const container = document.getElementById('main-tabs');
    const keys = Object.keys(linkData);
    keys.forEach((cat, idx) => {
        const btn = document.createElement('button');
        btn.className = 'main-btn';
        btn.innerText = cat;
        btn.onclick = () => setMainTab(cat, btn);
        container.appendChild(btn);
        if(idx === 0) setTimeout(() => btn.click(), 50);
    });
}

function setMainTab(cat, btn) {
    currentLinkMain = cat;
    document.querySelectorAll('.main-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderSubTabs(cat);
}

function renderSubTabs(mainCat) {
    const container = document.getElementById('sub-tabs');
    const wrapper = document.getElementById('sub-tabs-container');
    container.innerHTML = '';
    
    const subKeys = Object.keys(linkData[mainCat] || {});
    
    if(subKeys.length > 0) {
        wrapper.style.display = 'block';
        subKeys.forEach((sub, idx) => {
            const btn = document.createElement('button');
            btn.className = 'sub-btn';
            btn.innerText = sub;
            btn.onclick = () => setSubTab(sub, btn);
            container.appendChild(btn);
            if(idx === 0) setTimeout(() => btn.click(), 10);
        });
    } else {
        wrapper.style.display = 'none';
        document.getElementById('links-content-area').innerHTML = '<p style="text-align:center">No Content</p>';
    }
}

function setSubTab(subCat, btn) {
    document.querySelectorAll('#sub-tabs .sub-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    const container = document.getElementById('links-content-area');
    container.innerHTML = '';
    const topics = linkData[currentLinkMain][subCat];

    Object.keys(topics).forEach(topicName => {
        const details = document.createElement('details');
        details.open = true;
        const summary = document.createElement('summary');
        summary.innerText = topicName;
        details.appendChild(summary);

        const list = document.createElement('div');
        list.style.display = 'flex'; list.style.flexDirection = 'column';

        topics[topicName].forEach(link => {
            let domain = "";
            try { domain = new URL(link.url).hostname; } catch(e){ domain = "google.com"; }
            const icon = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;

            const a = document.createElement('a');
            a.className = 'link-item';
            a.href = link.url;
            a.target = "_blank";
            a.innerHTML = `
                <img src="${icon}" class="link-icon" onerror="this.src='https://via.placeholder.com/24'">
                <div style="display:flex; flex-direction:column;">
                    <span class="link-title">${link.name}</span>
                    <span class="link-url">${link.url}</span>
                </div>
            `;
            list.appendChild(a);
        });
        details.appendChild(list);
        container.appendChild(details);
    });
}

// ==========================================
// PART 2: BLOG SYSTEM LOGIC (JSON/MD)
// ==========================================
let allPosts = [];

async function initBlog() {
    try {
        const response = await fetch('data.json?t=' + new Date().getTime());
        if (!response.ok) throw new Error("data.json not found");
        const data = await response.json();
        allPosts = data.sort((a, b) => new Date(b.date) - new Date(a.date));
        // Default to Physics
        document.querySelector('.filter-btn').click();
    } catch (err) {
        console.log('Blog Load Error:', err);
        document.getElementById('posts-container').innerHTML = `
            <div style="text-align:center; padding:20px; color:#ff5252; background:rgba(255,82,82,0.1); border-radius:8px;">
                ⚠️ <b>Blog Data Not Found</b><br>
                <small>Please ensure 'data.json' exists in the same folder.</small>
            </div>`;
    }
}

function filterPosts(category, btn) {
    // 1. Activate Main Button
    if(btn) {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    }

    // 2. Check for Subcategories
    const relevantPosts = allPosts.filter(post => post.category === category);
    const subCategories = [...new Set(relevantPosts.map(p => p.subcategory).filter(Boolean))];

    const subContainerWrapper = document.getElementById('blog-sub-container');
    const subContainer = document.getElementById('blog-sub-filters');
    subContainer.innerHTML = ''; 

    if (subCategories.length > 0) {
        subContainerWrapper.style.display = 'block';
        
        subCategories.forEach((sub, idx) => {
            const subBtn = document.createElement('button');
            subBtn.className = 'sub-btn'; 
            subBtn.innerText = sub;
            subBtn.onclick = () => {
                document.querySelectorAll('#blog-sub-filters .sub-btn').forEach(b => b.classList.remove('active'));
                subBtn.classList.add('active');
                renderBlogPosts(category, sub);
            };
            subContainer.appendChild(subBtn);

            if(idx === 0) subBtn.click();
        });
    } else {
        subContainerWrapper.style.display = 'none';
        renderBlogPosts(category, null);
    }
    
    showBlogList();
}

function renderBlogPosts(category, subcat) {
    const container = document.getElementById('posts-container');
    container.innerHTML = '';

    // ၁. အရင်ဆုံး သက်ဆိုင်ရာ Category နဲ့ Subcategory ကို စစ်ထုတ် (Filter) မယ်
    let filtered = allPosts.filter(post => {
        if (subcat) {
            return post.category === category && post.subcategory === subcat;
        }
        return post.category === category;
    });

    // ၂. ဒီနေရာမှာ Sorting Logic ခွဲမယ်
    if (category === "BEHS") {
        // BEHS ဖြစ်ရင် -> ခေါင်းစဉ် (Title) အလိုက် ငယ်စဉ်ကြီးလိုက် စီမယ် (Chapter 1, 2, 10...)
        filtered.sort((a, b) => a.title.localeCompare(b.title, undefined, {numeric: true}));
    } else {
        // BEHS မဟုတ်ရင် (Physics, Math, etc.) -> ရက်စွဲ (Date) အလိုက် အသစ်အပေါ်တင်မယ်
        filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    // ၃. Data မရှိရင် စာပြမယ်
    if(filtered.length === 0) {
        container.innerHTML = `<p style="text-align:center; color:#666">No posts found.</p>`;
        return;
    }

    // ၄. ပုံဖော်ပြသမယ် (Render)
    filtered.forEach(post => {
        const item = document.createElement('div');
        item.className = 'post-card';
        item.onclick = () => loadArticle(post.filename);
        item.innerHTML = `
            <h4 style="margin:0 0 5px 0; color:#fff">${post.title}</h4>
            <span style="color:var(--muted); font-size:0.85rem">📅 ${post.date}</span>
        `;
        container.appendChild(item);
    });
}

function loadArticle(filename) {
    document.getElementById('blog-list-view').style.display = 'none';
    document.getElementById('article-view').style.display = 'block';
    const contentDiv = document.getElementById('article-content');
    contentDiv.innerHTML = '<div style="text-align:center; margin-top:20px;">Loading content...</div>';

    fetch(filename)
        .then(res => {
            if (!res.ok) throw new Error("File not found");
            return res.text();
        })
        .then(md => {
            contentDiv.innerHTML = marked.parse(md);
            if(window.MathJax) window.MathJax.typesetPromise();
            renderGraphs();
        })
        .catch(err => {
            contentDiv.innerHTML = `<p style="color:red; text-align:center">Error loading article: ${filename}</p>`;
        });
}

function showBlogList() {
    document.getElementById('article-view').style.display = 'none';
    document.getElementById('blog-list-view').style.display = 'block';
}

function renderGraphs() {
    try {
        document.querySelectorAll('.math-graph').forEach(graphDiv => {
            const equation = graphDiv.getAttribute('data-fn');
            const graphId = graphDiv.getAttribute('id');
            const pointsAttr = graphDiv.getAttribute('data-points');
            
            if(!graphId) return;

            let graphData = [{ fn: equation, color: '#0ea5e9' }];

            if (pointsAttr) {
                try {
                    const points = JSON.parse(pointsAttr);
                    graphData.push({
                        points: points,
                        fnType: 'points',
                        graphType: 'scatter',
                        color: '#ff5252',
                        attr: { r: 5 }
                    });
                } catch (e) { console.error("Points parse error", e); }
            }

            functionPlot({
                target: '#' + graphId,
                width: 550, height: 350, grid: true, data: graphData
            });
        });
    } catch(e) { console.log("Graph Error:", e); }
}

// Start Applications
initLinks(); 
initBlog();