(function(){
  const NEWS_URL = 'news.json';

  async function loadNews(){
    const res = await fetch(NEWS_URL, { cache: 'no-store' });
    if(!res.ok) throw new Error('Failed to load news');
    const data = await res.json();
    if(!Array.isArray(data)) return [];
    return data
      .filter(Boolean)
      .map(x => ({...x, date: (x.date || '').toString()}))
      .sort((a,b) => (b.date || '').localeCompare(a.date || ''));
  }

  function fmtDateRU(dateStr){
    // dateStr expected YYYY-MM-DD
    try{
      const [y,m,d] = dateStr.split('-').map(Number);
      const dt = new Date(y, (m||1)-1, d||1);
      return dt.toLocaleDateString('ru-RU', { day:'2-digit', month:'long', year:'numeric' });
    }catch(e){
      return dateStr;
    }
  }

  function hasTag(itemTags, wanted){
    if(!wanted || !wanted.length) return true;
    const tags = (itemTags || []).map(t => (t||'').toString().toLowerCase());
    return wanted.some(t => tags.includes((t||'').toString().toLowerCase()) || tags.includes('all'));
  }

  function escapeHtml(str){
    return String(str ?? '').replace(/[&<>"']/g, (m)=>({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
    }[m]));
  }

  function renderCards(list, container, opts){
    const limit = opts?.limit ?? 3;
    const tags = opts?.tags || null;
    const filtered = list.filter(n => hasTag(n.tags, tags)).slice(0, limit);

    if(!filtered.length){
      container.innerHTML = '<div style="color:rgba(255,255,255,.65);text-align:center;">Пока нет новостей.</div>';
      return;
    }

    container.innerHTML = filtered.map(n => {
      const date = fmtDateRU(n.date);
      return `
        <article class="news-card">
          <div class="news-card__date">${escapeHtml(date)}</div>
          <div class="news-card__title">${escapeHtml(n.title)}</div>
          <div class="news-card__text">${escapeHtml(n.text || '')}</div>
          <a class="news-card__link" href="news.html#${encodeURIComponent(n.id)}">Читать →</a>
        </article>
      `;
    }).join('');
  }

  async function renderNewsPreview(containerId, opts){
    const el = document.getElementById(containerId);
    if(!el) return;

    try{
      const news = await loadNews();
      renderCards(news, el, opts);
    }catch(e){
      el.innerHTML = '<div style="color:rgba(255,255,255,.65);text-align:center;">Новости временно недоступны.</div>';
    }
  }

  async function renderNewsPage(){
    const listEl = document.getElementById('newsList');
    if(!listEl) return;

    try{
      const news = await loadNews();
      listEl.innerHTML = news.map(n => {
        const date = fmtDateRU(n.date);
        return `
          <article class="news-article" id="${escapeHtml(n.id)}">
            <div class="news-article__date">${escapeHtml(date)}</div>
            <h2 class="news-article__title">${escapeHtml(n.title)}</h2>
            <p class="news-article__text">${escapeHtml(n.body || n.text || '')}</p>
          </article>
        `;
      }).join('');

      // Smooth scroll to hash if any
      if(location.hash){
        const id = decodeURIComponent(location.hash.slice(1));
        const target = document.getElementById(id);
        if(target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }

    }catch(e){
      listEl.innerHTML = '<div style="color:rgba(255,255,255,.65);text-align:center;">Новости временно недоступны.</div>';
    }
  }

  window.renderNewsPreview = renderNewsPreview;
  window.renderNewsPage = renderNewsPage;
  window.__loadNews = loadNews; // for model pages
})();
