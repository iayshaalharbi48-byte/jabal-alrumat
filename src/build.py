s=open("app.html").read()
# خطّ ثمانية مضمَّنٌ في التطبيق نفسه (data URL) كما يجيزه ترخيصه، ولا يُرفع ملفًّا مستقلًّا.
te=s.index("</title>")+8
head='''<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#EFE8EE">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="جبل الرماة">
<link rel="manifest" href="manifest.webmanifest">
<link rel="apple-touch-icon" href="apple-touch-icon-v2.png">
<link rel="icon" href="icon-192-v2.png">
<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}[hidden]{display:none!important}</style>
'''
b=s[te:];i=b.index('<header class="top">')
open("../index.html","w").write(head+s[:te]+b[:i]+"</head>\n<body>\n"+b[i:]+'''
<script>if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));</script>
</body>
</html>
''')
