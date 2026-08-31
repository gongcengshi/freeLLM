document.getElementById('sendBtn').addEventListener('click', function() {
  var url = document.getElementById('in-url').value;
  var key = document.getElementById('in-key').value;
  var model = document.getElementById('in-model').value;
  var strategy = document.getElementById('in-strategy').value;
  var msg = document.getElementById('in-msg').value;
  var tokens = parseInt(document.getElementById('in-tokens').value) || 200;
  var btn = document.getElementById('sendBtn');
  var area = document.getElementById('outArea');
  var meta = document.getElementById('outMeta');

  if (!key) { alert('请输入 Proxy API Key'); return; }

  btn.disabled = true;
  btn.textContent = '请求中...';
  area.className = 'resarea';
  area.textContent = '正在发送请求...';
  meta.style.display = 'none';

  var headers = { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key };
  if (strategy) headers['X-Freellm-Strategy'] = strategy;

  var t0 = Date.now();
  fetch(url + '/chat/completions', {
    method: 'POST',
    headers: headers,
    body: JSON.stringify({ model: model, max_tokens: tokens, messages: [{ role: 'user', content: msg }] })
  })
  .then(function(r) {
    var lat = Date.now() - t0;
    return r.json().then(function(d) { return { ok: r.ok, data: d, lat: lat }; });
  })
  .then(function(r) {
    if (!r.ok) {
      area.className = 'resarea err';
      area.textContent = JSON.stringify(r.data, null, 2);
    } else {
      area.className = 'resarea ok';
      var content = (r.data.choices && r.data.choices[0] && r.data.choices[0].message) ? r.data.choices[0].message.content : '(无内容)';
      var prov = r.data['x-freellm-provider'] || '-';
      var mdl = r.data['x-freellm-model'] || '-';
      var tok = (r.data.usage) ? r.data.usage.total_tokens : 0;
      area.textContent = content;
      meta.style.display = 'flex';
      document.getElementById('mLatency').textContent = '耗时 ' + r.lat + 'ms';
      document.getElementById('mProvider').textContent = 'Provider: ' + prov + ' / ' + mdl;
      document.getElementById('mTokens').textContent = 'Tokens: ' + tok;
    }
  })
  .catch(function(e) {
    area.className = 'resarea err';
    area.textContent = '请求失败: ' + e.message;
  })
  .finally(function() {
    btn.disabled = false;
    btn.textContent = '发送请求';
  });
});

document.querySelectorAll('.ctab').forEach(function(tab) {
  tab.addEventListener('click', function() {
    document.querySelectorAll('.ctab').forEach(function(t) { t.classList.remove('on'); });
    document.querySelectorAll('.cblk').forEach(function(b) { b.classList.remove('on'); });
    tab.classList.add('on');
    document.getElementById('t-' + tab.getAttribute('data-tab')).classList.add('on');
  });
});

fetch('/admin/providers').then(function(r) { return r.json(); }).then(function(list) {
  document.getElementById('pgrid').innerHTML = list.map(function(p) {
    return '<div class="pcard"><div class="n">' + p.name + '</div><div class="m">' + p.models.length + ' 个模型</div><div class="badge">免费</div></div>';
  }).join('');
}).catch(function() {});
