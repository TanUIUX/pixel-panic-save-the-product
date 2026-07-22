/* ============================================================
   PIXEL PANIC — game.js LOADER
   ------------------------------------------------------------
   File game.js gốc (~108KB) được chia thành 4 phần
   (game.part1.js … game.part4.js) để đẩy lên GitHub an toàn.
   Loader này tải cả 4 phần theo đúng thứ tự, nối lại thành
   mã hoàn chỉnh rồi inject vào trang. Game tự khởi động
   (initGame) sau khi script được chèn vào.

   Lưu ý: fetch() yêu cầu trang được phục vụ qua HTTP/HTTPS
   (ví dụ GitHub Pages). Mở trực tiếp bằng file:// sẽ bị
   trình duyệt chặn.
   ============================================================ */
(function(){
  var parts = ['game.part1.js','game.part2.js','game.part3.js','game.part4.js'];
  Promise.all(parts.map(function(p){
    return fetch(p).then(function(r){
      if(!r.ok) throw new Error('Không tải được '+p+' (HTTP '+r.status+')');
      return r.text();
    });
  })).then(function(txts){
    var s = document.createElement('script');
    s.textContent = txts.join('');
    document.body.appendChild(s);
  }).catch(function(e){
    document.body.innerHTML = '<div style="font-family:system-ui,sans-serif;max-width:640px;margin:60px auto;padding:24px;background:#12060f;color:#fff;border:1px solid #ff5d6c;border-radius:12px;line-height:1.6">'
      + '<h2 style="color:#ff5d6c;margin-top:0">⚠️ Không tải được game</h2>'
      + '<p>' + (e && e.message ? e.message : e) + '</p>'
      + '<p style="color:#9aa">Game được chia thành nhiều phần và cần được phục vụ qua một web server (HTTP/HTTPS). '
      + 'Vui lòng mở bằng <b>GitHub Pages</b> hoặc chạy một local server '
      + '(ví dụ: <code>python -m http.server</code>) thay vì mở trực tiếp file HTML bằng <code>file://</code>.</p>'
      + '</div>';
  });
})();
