import{k as z,m as D,n as k,s as y,o as i,_ as f,p as j,c as A,q as S,t as U,v as T,j as t,w as O,x as w,y as E,z as K,r as W,i as X,B as C,T as d}from"./index-81665f4a.js";function Z(r){return z("MuiLinearProgress",r)}D("MuiLinearProgress",["root","colorPrimary","colorSecondary","determinate","indeterminate","buffer","query","dashed","dashedColorPrimary","dashedColorSecondary","bar","barColorPrimary","barColorSecondary","bar1Indeterminate","bar1Determinate","bar1Buffer","bar2Indeterminate","bar2Buffer"]);const F=["className","color","value","valueBuffer","variant"];let b=r=>r,B,R,I,M,q,N;const P=4,G=k(B||(B=b`
  0% {
    left: -35%;
    right: 100%;
  }

  60% {
    left: 100%;
    right: -90%;
  }

  100% {
    left: 100%;
    right: -90%;
  }
`)),H=k(R||(R=b`
  0% {
    left: -200%;
    right: 100%;
  }

  60% {
    left: 107%;
    right: -8%;
  }

  100% {
    left: 107%;
    right: -8%;
  }
`)),J=k(I||(I=b`
  0% {
    opacity: 1;
    background-position: 0 -23px;
  }

  60% {
    opacity: 0;
    background-position: 0 -23px;
  }

  100% {
    opacity: 1;
    background-position: -200px -23px;
  }
`)),Q=r=>{const{classes:e,variant:a,color:o}=r,c={root:["root",`color${i(o)}`,a],dashed:["dashed",`dashedColor${i(o)}`],bar1:["bar",`barColor${i(o)}`,(a==="indeterminate"||a==="query")&&"bar1Indeterminate",a==="determinate"&&"bar1Determinate",a==="buffer"&&"bar1Buffer"],bar2:["bar",a!=="buffer"&&`barColor${i(o)}`,a==="buffer"&&`color${i(o)}`,(a==="indeterminate"||a==="query")&&"bar2Indeterminate",a==="buffer"&&"bar2Buffer"]};return w(c,Z,e)},$=(r,e)=>e==="inherit"?"currentColor":r.vars?r.vars.palette.LinearProgress[`${e}Bg`]:r.palette.mode==="light"?E(r.palette[e].main,.62):K(r.palette[e].main,.5),Y=y("span",{name:"MuiLinearProgress",slot:"Root",overridesResolver:(r,e)=>{const{ownerState:a}=r;return[e.root,e[`color${i(a.color)}`],e[a.variant]]}})(({ownerState:r,theme:e})=>f({position:"relative",overflow:"hidden",display:"block",height:4,zIndex:0,"@media print":{colorAdjust:"exact"},backgroundColor:$(e,r.color)},r.color==="inherit"&&r.variant!=="buffer"&&{backgroundColor:"none","&::before":{content:'""',position:"absolute",left:0,top:0,right:0,bottom:0,backgroundColor:"currentColor",opacity:.3}},r.variant==="buffer"&&{backgroundColor:"transparent"},r.variant==="query"&&{transform:"rotate(180deg)"})),V=y("span",{name:"MuiLinearProgress",slot:"Dashed",overridesResolver:(r,e)=>{const{ownerState:a}=r;return[e.dashed,e[`dashedColor${i(a.color)}`]]}})(({ownerState:r,theme:e})=>{const a=$(e,r.color);return f({position:"absolute",marginTop:0,height:"100%",width:"100%"},r.color==="inherit"&&{opacity:.3},{backgroundImage:`radial-gradient(${a} 0%, ${a} 16%, transparent 42%)`,backgroundSize:"10px 10px",backgroundPosition:"0 -23px"})},j(M||(M=b`
    animation: ${0} 3s infinite linear;
  `),J)),rr=y("span",{name:"MuiLinearProgress",slot:"Bar1",overridesResolver:(r,e)=>{const{ownerState:a}=r;return[e.bar,e[`barColor${i(a.color)}`],(a.variant==="indeterminate"||a.variant==="query")&&e.bar1Indeterminate,a.variant==="determinate"&&e.bar1Determinate,a.variant==="buffer"&&e.bar1Buffer]}})(({ownerState:r,theme:e})=>f({width:"100%",position:"absolute",left:0,bottom:0,top:0,transition:"transform 0.2s linear",transformOrigin:"left",backgroundColor:r.color==="inherit"?"currentColor":(e.vars||e).palette[r.color].main},r.variant==="determinate"&&{transition:`transform .${P}s linear`},r.variant==="buffer"&&{zIndex:1,transition:`transform .${P}s linear`}),({ownerState:r})=>(r.variant==="indeterminate"||r.variant==="query")&&j(q||(q=b`
      width: auto;
      animation: ${0} 2.1s cubic-bezier(0.65, 0.815, 0.735, 0.395) infinite;
    `),G)),er=y("span",{name:"MuiLinearProgress",slot:"Bar2",overridesResolver:(r,e)=>{const{ownerState:a}=r;return[e.bar,e[`barColor${i(a.color)}`],(a.variant==="indeterminate"||a.variant==="query")&&e.bar2Indeterminate,a.variant==="buffer"&&e.bar2Buffer]}})(({ownerState:r,theme:e})=>f({width:"100%",position:"absolute",left:0,bottom:0,top:0,transition:"transform 0.2s linear",transformOrigin:"left"},r.variant!=="buffer"&&{backgroundColor:r.color==="inherit"?"currentColor":(e.vars||e).palette[r.color].main},r.color==="inherit"&&{opacity:.3},r.variant==="buffer"&&{backgroundColor:$(e,r.color),transition:`transform .${P}s linear`}),({ownerState:r})=>(r.variant==="indeterminate"||r.variant==="query")&&j(N||(N=b`
      width: auto;
      animation: ${0} 2.1s cubic-bezier(0.165, 0.84, 0.44, 1) 1.15s infinite;
    `),H)),ar=A.forwardRef(function(e,a){const o=S({props:e,name:"MuiLinearProgress"}),{className:c,color:p="primary",value:l,valueBuffer:g,variant:n="indeterminate"}=o,u=U(o,F),m=f({},o,{color:p,variant:n}),v=Q(m),L=T(),h={},x={bar1:{},bar2:{}};if((n==="determinate"||n==="buffer")&&l!==void 0){h["aria-valuenow"]=Math.round(l),h["aria-valuemin"]=0,h["aria-valuemax"]=100;let s=l-100;L&&(s=-s),x.bar1.transform=`translateX(${s}%)`}if(n==="buffer"&&g!==void 0){let s=(g||0)-100;L&&(s=-s),x.bar2.transform=`translateX(${s}%)`}return t.jsxs(Y,f({className:O(v.root,c),ownerState:m,role:"progressbar"},h,{ref:a},u,{children:[n==="buffer"?t.jsx(V,{className:v.dashed,ownerState:m}):null,t.jsx(rr,{className:v.bar1,ownerState:m,style:x.bar1}),n==="determinate"?null:t.jsx(er,{className:v.bar2,ownerState:m,style:x.bar2})]}))}),tr=ar;var _={},or=X;Object.defineProperty(_,"__esModule",{value:!0});var nr=_.default=void 0,ir=or(W()),sr=t;nr=_.default=(0,ir.default)((0,sr.jsx)("path",{d:"M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4m0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4"}),"Person");const lr=({passwordVal:r})=>{if(!r)return null;let e=0;const a=r.length>=8,o=/[A-Z]/.test(r),c=/[a-z]/.test(r),p=/[0-9]/.test(r),l=/[^A-Za-z0-9]/.test(r);a&&(e+=1),o&&(e+=1),c&&(e+=1),p&&(e+=1),l&&(e+=1);const g=e/5*100;let n="Weak",u="error";return e>=4&&a?(n="Strong",u="success"):e>=2&&(n="Medium",u="warning"),t.jsxs(C,{sx:{mt:1,mb:1},children:[t.jsxs(C,{sx:{display:"flex",justifyContent:"space-between",alignItems:"center",mb:.5},children:[t.jsx(d,{variant:"caption",color:"text.secondary",children:"Password Strength:"}),t.jsx(d,{variant:"caption",color:`${u}.main`,sx:{fontWeight:"bold"},children:n})]}),t.jsx(tr,{variant:"determinate",value:g,color:u,sx:{height:6,borderRadius:3}}),t.jsxs(C,{sx:{mt:.5},children:[t.jsx(d,{variant:"caption",color:a?"success.main":"text.secondary",sx:{display:"block"},children:"✓ Minimum 8 characters"}),t.jsx(d,{variant:"caption",color:o&&c?"success.main":"text.secondary",sx:{display:"block"},children:"✓ Uppercase & lowercase letters"}),t.jsx(d,{variant:"caption",color:p?"success.main":"text.secondary",sx:{display:"block"},children:"✓ At least one number"}),t.jsx(d,{variant:"caption",color:l?"success.main":"text.secondary",sx:{display:"block"},children:"✓ At least one special character"})]})]})};export{lr as P,nr as d};
