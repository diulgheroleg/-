(function(){
  const data = window.DEVICE_DATA || {};

  const page = document.body.getAttribute('data-page'); // 'iphone' | 'android'
  if(!page) return;

  const BRANDS_ANDROID = [
    { key: 'samsung', label: 'Samsung' },
    { key: 'honor', label: 'Honor' },
    { key: 'xiaomi', label: 'Xiaomi' },
    { key: 'huawei', label: 'Huawei' }
  ];

  const brandTabsEl   = document.getElementById('brandTabs');
  const modelRowEl    = document.getElementById('modelRow');
  const modelRowMoreEl= document.getElementById('modelRowMore') || null;
  const modelTitleEl  = document.getElementById('modelTitle');
  const servicesEl    = document.getElementById('servicesGrid');
  const showAllBtn    = document.getElementById('showAllPrices');
  const newsEl        = document.getElementById('newsInPage');

  const MAX_VISIBLE_MODELS = 5;
  const MAX_POPULAR_MODELS = 20;
  const PREVIEW_SERVICES   = 10;

  let moreExpanded = false;
  let showAllServices = false;
  let lastBrandKey = '';
  let lastModelKey = '';


  function escapeHtml(str){
    return String(str ?? '').replace(/[&<>"']/g, (m)=>({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
    }[m]));
  }

  function getParams(){
    const p = new URLSearchParams(location.search);
    return {
      brand: (p.get('brand') || '').toLowerCase(),
      model: (p.get('model') || '').toLowerCase()
    };
  }

  function setParams(next){
    const p = new URLSearchParams(location.search);
    if(next.brand) p.set('brand', next.brand); else p.delete('brand');
    if(next.model) p.set('model', next.model); else p.delete('model');
    const url = location.pathname + (p.toString() ? '?' + p.toString() : '');
    history.replaceState(null, '', url);
  }

  function openTelegram(text){
    const shareUrl = 'https://t.me/share/url?url=&text=' + encodeURIComponent(text);
    window.open(shareUrl, '_blank', 'noopener');
    try { navigator.clipboard?.writeText(text); } catch(e) {}
  }

  function getBrandKey(){
    if(page === 'iphone') return 'iphone';
    const params = getParams();
    const allowed = new Set(BRANDS_ANDROID.map(x=>x.key));
    return allowed.has(params.brand) ? params.brand : 'samsung';
  }

  function brandLabelFromKey(brandKey){
    if(brandKey === 'iphone') return 'iPhone';
    const b = data[brandKey];
    return (b && b.brand) ? b.brand : brandKey;
  }

  function getModelsForBrand(brandKey){
    const b = data[brandKey];
    return (b && b.models) ? b.models : [];
  }

  function findModel(brandKey, modelKey){
    const models = getModelsForBrand(brandKey);
    return models.find(m => (m.modelKey || '').toLowerCase() === modelKey) || null;
  }

  function getDefaultModelKey(brandKey){
    const models = getModelsForBrand(brandKey);
    return (models[0] && models[0].modelKey) ? models[0].modelKey.toLowerCase() : '';
  }

  function buildFullModelTitle(brandLabel, modelName){
    const b = (brandLabel || '').trim();
    const m = (modelName || '').trim();
    if(!b) return m;
    if(!m) return b;
    const bl = b.toLowerCase();
    const ml = m.toLowerCase();
    if(ml === bl) return m;
    if(ml.startsWith(bl + ' ') || ml.startsWith(bl)) return m;
    return b + ' ' + m;
  }

  function buildBrandTabs(activeBrand){
    if(!brandTabsEl) return;

    // iPhone page: показываем только iPhone (без других категорий в этой строке)
    if(page === 'iphone'){
      brandTabsEl.innerHTML = `<button class="tab-btn is-active" type="button">iPhone</button>`;
      return;
    }

    // Android page: только бренды Android (без ноутбуков/планшетов и без iPhone в этой строке)
    const btns = [];
    BRANDS_ANDROID.forEach(b => {
      const cls = b.key === activeBrand ? 'tab-btn is-active' : 'tab-btn';
      btns.push(`<button class="${cls}" type="button" data-brand="${b.key}">${escapeHtml(b.label)}</button>`);
    });
    brandTabsEl.innerHTML = btns.join('');
  }

  function renderModelRows(brandKey, activeModelKey){
    if(!modelRowEl) return;

    const models = getModelsForBrand(brandKey);
    const visible = models.slice(0, MAX_VISIBLE_MODELS);
    const needMore = models.length > MAX_VISIBLE_MODELS;

    const mainBtns = visible.map(m => {
      const key = (m.modelKey || '').toLowerCase();
      const cls = key === activeModelKey ? 'model-btn is-active' : 'model-btn';
      return `<button class="${cls}" type="button" data-model="${escapeHtml(key)}">${escapeHtml(m.modelName)}</button>`;
    });

    if(needMore){
      const txt = moreExpanded ? 'Скрыть ▴' : 'Все модели ▾';
      mainBtns.push(`<button class="model-btn model-btn--more" type="button" data-more="1">${txt}</button>`);
    }

    modelRowEl.innerHTML = mainBtns.join('');

    if(modelRowMoreEl){
      if(needMore && moreExpanded){
        const popular = models.slice(0, MAX_POPULAR_MODELS);
        modelRowMoreEl.innerHTML = popular.map(m => {
          const key = (m.modelKey || '').toLowerCase();
          const cls = key === activeModelKey ? 'model-btn is-active' : 'model-btn';
          return `<button class="${cls}" type="button" data-model="${escapeHtml(key)}">${escapeHtml(m.modelName)}</button>`;
        }).join('');
        modelRowMoreEl.style.display = '';
      } else {
        modelRowMoreEl.style.display = 'none';
        modelRowMoreEl.innerHTML = '';
      }
    }
  }

  function renderServicesTable(model, brandLabel){
    if(!servicesEl) return;

    const services = (model && model.services) ? model.services : [];
    if(!services.length){
      servicesEl.innerHTML = '<div style="padding:16px;color:rgba(255,255,255,.7)">Нет данных по услугам. Напишите нам — уточним цены.</div>';
      if(showAllBtn) showAllBtn.style.display = 'none';
      return;
    }

    const canExpand = services.length > PREVIEW_SERVICES;
    if(showAllBtn){
      showAllBtn.style.display = canExpand ? '' : 'none';
      showAllBtn.textContent = showAllServices ? 'Скрыть услуги' : 'Посмотреть все услуги';
    }

    const fullTitle = buildFullModelTitle(brandLabel, model.modelName);

    const list = showAllServices ? services : services.slice(0, PREVIEW_SERVICES);
    const rows = [];
    for(let i=0;i<list.length;i+=2){
      const a = list[i];
      const b = list[i+1] || null;

      const cell = (s)=>{
        if(!s) return `<div class="svc-cell" style="visibility:hidden"></div>`;
        const msg = `Здравствуйте! Хочу записаться на ремонт.\n\n${fullTitle}\nУслуга: ${s.name}\nЦена: ${s.price}\n\n(сообщение с сайта)`;
        return `
          <div class="svc-cell">
            <div class="svc-info">
              <div class="svc-name">${escapeHtml(s.name)}</div>
              <div class="svc-price">${escapeHtml(s.price || 'Цена по запросу')}</div>
            </div>
            <button class="svc-btn" type="button" data-tg="${escapeHtml(msg)}">Записаться</button>
          </div>
        `;
      };

      rows.push(`<div class="svc-row">${cell(a)}${cell(b)}</div>`);
    }

    servicesEl.innerHTML = rows.join('');
  }

  function renderAll(){
    const brandKey = getBrandKey();
    buildBrandTabs(brandKey);

    const params = getParams();
    const models = getModelsForBrand(brandKey);

    const modelKey = params.model && findModel(brandKey, params.model) ? params.model : getDefaultModelKey(brandKey);

    // При смене бренда/модели сбрасываем раскрытие "все услуги"
    if(brandKey !== lastBrandKey || modelKey !== lastModelKey){
      showAllServices = false;
      lastBrandKey = brandKey;
      lastModelKey = modelKey;
    }

    setParams({ brand: page === 'iphone' ? '' : brandKey, model: modelKey });

    renderModelRows(brandKey, modelKey);

    const model = findModel(brandKey, modelKey);
    const brandLabel = brandLabelFromKey(brandKey);

    if(modelTitleEl){
      modelTitleEl.textContent = model ? buildFullModelTitle(brandLabel, model.modelName) : brandLabel;
    }

    renderServicesTable(model, brandLabel);

    if(showAllBtn){
      showAllBtn.onclick = function(){
        if(!model) return;
        showAllServices = !showAllServices;
        renderServicesTable(model, brandLabel);
      };
    }

    // News in page (2 cards)
    if(newsEl && window.__loadNews){
      const tags = page === 'iphone'
        ? ['iphone']
        : ['android', brandKey];

      window.__loadNews().then(list => {
        const filtered = list.filter(n => {
          const t = (n.tags || []).map(x => (x||'').toString().toLowerCase());
          return t.includes('all') || tags.some(k => t.includes(k));
        }).slice(0,2);

        if(!filtered.length){
          newsEl.innerHTML = '<div style="color:rgba(255,255,255,.65);text-align:center;">Пока нет новостей.</div>';
          return;
        }

        newsEl.innerHTML = filtered.map(n => `
          <article class="news-card">
            <div class="news-card__date">${escapeHtml(n.date)}</div>
            <div class="news-card__title">${escapeHtml(n.title)}</div>
            <div class="news-card__text">${escapeHtml(n.text || '')}</div>
            <a class="news-card__link" href="news.html#${encodeURIComponent(n.id)}">Читать →</a>
          </article>
        `).join('');
      }).catch(()=>{
        newsEl.innerHTML = '<div style="color:rgba(255,255,255,.65);text-align:center;">Новости временно недоступны.</div>';
      });
    }
  }

  // Events
  document.addEventListener('click', function(e){
    // Android brand tabs (buttons only)
    const brandBtn = e.target.closest('[data-brand]');
    if(brandBtn && brandTabsEl && brandTabsEl.contains(brandBtn)){
      const nextBrand = (brandBtn.getAttribute('data-brand') || '').toLowerCase();
      moreExpanded = false;
      showAllServices = false;
      setParams({ brand: nextBrand, model: '' });
      renderAll();
      return;
    }

    // Model chips
    const modelBtn = e.target.closest('[data-model]');
    if(modelBtn && (modelRowEl?.contains(modelBtn) || modelRowMoreEl?.contains(modelBtn))){
      const nextModel = (modelBtn.getAttribute('data-model') || '').toLowerCase();
      const brandKey = getBrandKey();
      showAllServices = false;
      setParams({ brand: page === 'iphone' ? '' : brandKey, model: nextModel });
      renderAll();
      return;
    }

    // More toggle
    const moreBtn = e.target.closest('[data-more="1"]');
    if(moreBtn && modelRowEl?.contains(moreBtn)){
      moreExpanded = !moreExpanded;
      renderAll();
      return;
    }

    // Telegram booking buttons
    const tgBtn = e.target.closest('[data-tg]');
    if(tgBtn){
      const msg = tgBtn.getAttribute('data-tg') || '';
      openTelegram(msg);
      return;
    }
  });

  document.addEventListener('DOMContentLoaded', renderAll);
})();