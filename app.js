const $=id=>document.getElementById(id);
let file=null, image=null, outputBlob=null;

function fmt(bytes){if(bytes<1024)return bytes+" B";if(bytes<1048576)return (bytes/1024).toFixed(0)+" KB";return (bytes/1048576).toFixed(2)+" MB"}
function dims(w,h){return `${w} × ${h} px`}

$("quality").oninput=()=>{$("qualityVal").textContent=$("quality").value+" %"}
$("dimension").oninput=()=>{$("dimVal").textContent=$("dimension").value+" px"}

$("file").onchange=async e=>{
 file=e.target.files?.[0]; if(!file)return;
 try{
   image=await createImageBitmap(file);
 }catch{
   image=new Image();
   image.src=URL.createObjectURL(file);
   await new Promise((res,rej)=>{image.onload=res;image.onerror=rej});
 }
 $("preview").src=URL.createObjectURL(file);
 $("preview").style.display="block";
 $("original").style.display="grid";
 $("settings").style.display="block";
 $("result").style.display="none";
 $("origSize").textContent=fmt(file.size);
 $("origDim").textContent=dims(image.width,image.height);
 $("status").textContent="";
};

$("compress").onclick=async()=>{
 if(!file||!image)return;
 $("compress").disabled=true;$("status").textContent="Komprimiere …";
 const max=+$("dimension").value, q=+$("quality").value/100;
 const scale=Math.min(1,max/Math.max(image.width,image.height));
 const w=Math.max(1,Math.round(image.width*scale)),h=Math.max(1,Math.round(image.height*scale));
 const canvas=document.createElement("canvas");canvas.width=w;canvas.height=h;
 const ctx=canvas.getContext("2d",{alpha:true});
 ctx.drawImage(image,0,0,w,h);
 let type=$("format").value;
 // PNG ignores JPEG/WebP quality; WebP may not be available on unusual browsers.
 outputBlob=await new Promise(resolve=>canvas.toBlob(resolve,type,type==="image/png"?undefined:q));
 if(!outputBlob && type!=="image/jpeg"){
   type="image/jpeg";
   outputBlob=await new Promise(resolve=>canvas.toBlob(resolve,type,q));
 }
 $("newSize").textContent=fmt(outputBlob.size);
 $("saving").textContent=Math.max(0,(1-outputBlob.size/file.size)*100).toFixed(1)+" %";
 $("newDim").textContent=dims(w,h);
 $("result").style.display="block";
 $("status").textContent="Fertig.";
 $("compress").disabled=false;
};

$("save").onclick=async()=>{
 if(!outputBlob)return;
 const ext=outputBlob.type==="image/png"?"png":outputBlob.type==="image/webp"?"webp":"jpg";
 const outFile=new File([outputBlob],`BildKompressor-${Date.now()}.${ext}`,{type:outputBlob.type});
 if(navigator.share && navigator.canShare?.({files:[outFile]})){
   try{await navigator.share({files:[outFile],title:"Komprimiertes Bild"});return}catch(e){}
 }
 const url=URL.createObjectURL(outputBlob);
 const a=document.createElement("a");a.href=url;a.download=outFile.name;a.click();
 setTimeout(()=>URL.revokeObjectURL(url),1000);
};
