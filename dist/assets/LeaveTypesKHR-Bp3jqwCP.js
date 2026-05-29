import{j as e}from"./ui-vendor-Cu1MhdpG.js";import{a,L as t}from"./react-vendor-mLIif802.js";import{e as s}from"./auth-Q7mK7J6n.js";import{e as r,f as o,C as l,D as i,c as n,h as d}from"./index-CS-ZA8ZP.js";import{C as c}from"./dashboard-TywNCwwa.js";import"./redux-vendor-JoTbaKw9.js";import"./crm-5eIR71QW.js";import"./projects-DoX6HTlV.js";import"./hrm-nZOXwhTN.js";let m,u,p,v={data:""},f=/(?:([\u0080-\uFFFF\w-%@]+) *:? *([^{;]+?);|([^;}{]*?) *{)|(}\s*)/g,g=/\/\*[^]*?\*\/|  +/g,b=/\n+/g,y=(e,a)=>{let t="",s="",r="";for(let o in e){let l=e[o];"@"==o[0]?"i"==o[1]?t=o+" "+l+";":s+="f"==o[1]?y(l,o):o+"{"+y(l,"k"==o[1]?"":a)+"}":"object"==typeof l?s+=y(l,a?a.replace(/([^,])+/g,e=>o.replace(/([^,]*:\S+\([^)]*\))|([^,])+/g,a=>/&/.test(a)?a.replace(/&/g,e):e?e+" "+a:a)):o):null!=l&&(o=/^--/.test(o)?o:o.replace(/[A-Z]/g,"-$&").toLowerCase(),r+=y.p?y.p(o,l):o+":"+l+";")}return t+(a&&r?a+"{"+r+"}":r)+s},h={},x=e=>{if("object"==typeof e){let a="";for(let t in e)a+=t+x(e[t]);return a}return e};function j(e){let a=this||{},t=e.call?e(a.p):e;return((e,a,t,s,r)=>{let o=x(e),l=h[o]||(h[o]=(e=>{let a=0,t=11;for(;a<e.length;)t=101*t+e.charCodeAt(a++)>>>0;return"go"+t})(o));if(!h[l]){let a=o!==e?e:(e=>{let a,t,s=[{}];for(;a=f.exec(e.replace(g,""));)a[4]?s.shift():a[3]?(t=a[3].replace(b," ").trim(),s.unshift(s[0][t]=s[0][t]||{})):s[0][a[1]]=a[2].replace(b," ").trim();return s[0]})(e);h[l]=y(r?{["@keyframes "+l]:a}:a,t?"":"."+l)}let i=t&&h.g?h.g:null;return t&&(h.g=h[l]),n=h[l],d=a,c=s,(m=i)?d.data=d.data.replace(m,n):-1===d.data.indexOf(n)&&(d.data=c?n+d.data:d.data+n),l;var n,d,c,m})(t.unshift?t.raw?((e,a,t)=>e.reduce((e,s,r)=>{let o=a[r];if(o&&o.call){let e=o(t),a=e&&e.props&&e.props.className||/^go/.test(e)&&e;o=a?"."+a:e&&"object"==typeof e?e.props?"":y(e,""):!1===e?"":e}return e+s+(null==o?"":o)},""))(t,[].slice.call(arguments,1),a.p):t.reduce((e,t)=>Object.assign(e,t&&t.call?t(a.p):t),{}):t,(e=>{if("object"==typeof window){let a=(e?e.querySelector("#_goober"):window._goober)||Object.assign(document.createElement("style"),{innerHTML:" ",id:"_goober"});return a.nonce=window.__nonce__,a.parentNode||(e||document.head).appendChild(a),a.firstChild}return e||v})(a.target),a.g,a.o,a.k)}j.bind({g:1});let _=j.bind({k:1});function N(e,a){let t=this||{};return function(){let a=arguments;return function s(r,o){let l=Object.assign({},r),i=l.className||s.className;t.p=Object.assign({theme:u&&u()},l),t.o=/ *go\d+/.test(i),l.className=j.apply(t,a)+(i?" "+i:"");let n=e;return e[0]&&(n=l.as||e,delete l.as),p&&n[0]&&p(l),m(n,l)}}}var w=(e,a)=>(e=>"function"==typeof e)(e)?e(a):e,S=(()=>{let e=0;return()=>(++e).toString()})(),C=(()=>{let e;return()=>{if(void 0===e&&typeof window<"u"){let a=matchMedia("(prefers-reduced-motion: reduce)");e=!a||a.matches}return e}})(),E="default",L=(e,a)=>{let{toastLimit:t}=e.settings;switch(a.type){case 0:return{...e,toasts:[a.toast,...e.toasts].slice(0,t)};case 1:return{...e,toasts:e.toasts.map(e=>e.id===a.toast.id?{...e,...a.toast}:e)};case 2:let{toast:s}=a;return L(e,{type:e.toasts.find(e=>e.id===s.id)?1:0,toast:s});case 3:let{toastId:r}=a;return{...e,toasts:e.toasts.map(e=>e.id===r||void 0===r?{...e,dismissed:!0,visible:!1}:e)};case 4:return void 0===a.toastId?{...e,toasts:[]}:{...e,toasts:e.toasts.filter(e=>e.id!==a.toastId)};case 5:return{...e,pausedAt:a.time};case 6:let o=a.time-(e.pausedAt||0);return{...e,pausedAt:void 0,toasts:e.toasts.map(e=>({...e,pauseDuration:e.pauseDuration+o}))}}},k=[],$={toasts:[],pausedAt:void 0,settings:{toastLimit:20}},A={},I=(e,a=E)=>{A[a]=L(A[a]||$,e),k.forEach(([e,t])=>{e===a&&t(A[a])})},q=e=>Object.keys(A).forEach(a=>I(e,a)),F=(e=E)=>a=>{I(a,e)},T=e=>(a,t)=>{let s=((e,a="blank",t)=>({createdAt:Date.now(),visible:!0,dismissed:!1,type:a,ariaProps:{role:"status","aria-live":"polite"},message:e,pauseDuration:0,...t,id:(null==t?void 0:t.id)||S()}))(a,e,t);return F(s.toasterId||(e=>Object.keys(A).find(a=>A[a].toasts.some(a=>a.id===e)))(s.id))({type:2,toast:s}),s.id},D=(e,a)=>T("blank")(e,a);D.error=T("error"),D.success=T("success"),D.loading=T("loading"),D.custom=T("custom"),D.dismiss=(e,a)=>{let t={type:3,toastId:e};a?F(a)(t):q(t)},D.dismissAll=e=>D.dismiss(void 0,e),D.remove=(e,a)=>{let t={type:4,toastId:e};a?F(a)(t):q(t)},D.removeAll=e=>D.remove(void 0,e),D.promise=(e,a,t)=>{let s=D.loading(a.loading,{...t,...null==t?void 0:t.loading});return"function"==typeof e&&(e=e()),e.then(e=>{let r=a.success?w(a.success,e):void 0;return r?D.success(r,{id:s,...t,...null==t?void 0:t.success}):D.dismiss(s),e}).catch(e=>{let r=a.error?w(a.error,e):void 0;r?D.error(r,{id:s,...t,...null==t?void 0:t.error}):D.dismiss(s)}),e};var O,z,B,M,P=_`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
 transform: scale(1) rotate(45deg);
  opacity: 1;
}`,H=_`
from {
  transform: scale(0);
  opacity: 0;
}
to {
  transform: scale(1);
  opacity: 1;
}`,R=_`
from {
  transform: scale(0) rotate(90deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(90deg);
	opacity: 1;
}`,G=N("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${e=>e.primary||"#ff4b4b"};
  position: relative;
  transform: rotate(45deg);

  animation: ${P} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;

  &:after,
  &:before {
    content: '';
    animation: ${H} 0.15s ease-out forwards;
    animation-delay: 150ms;
    position: absolute;
    border-radius: 3px;
    opacity: 0;
    background: ${e=>e.secondary||"#fff"};
    bottom: 9px;
    left: 4px;
    height: 2px;
    width: 12px;
  }

  &:before {
    animation: ${R} 0.15s ease-out forwards;
    animation-delay: 180ms;
    transform: rotate(90deg);
  }
`,J=_`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`,W=N("div")`
  width: 12px;
  height: 12px;
  box-sizing: border-box;
  border: 2px solid;
  border-radius: 100%;
  border-color: ${e=>e.secondary||"#e0e0e0"};
  border-right-color: ${e=>e.primary||"#616161"};
  animation: ${J} 1s linear infinite;
`,Z=_`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(45deg);
	opacity: 1;
}`,K=_`
0% {
	height: 0;
	width: 0;
	opacity: 0;
}
40% {
  height: 0;
	width: 6px;
	opacity: 1;
}
100% {
  opacity: 1;
  height: 10px;
}`,Q=N("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${e=>e.primary||"#61d345"};
  position: relative;
  transform: rotate(45deg);

  animation: ${Z} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;
  &:after {
    content: '';
    box-sizing: border-box;
    animation: ${K} 0.2s ease-out forwards;
    opacity: 0;
    animation-delay: 200ms;
    position: absolute;
    border-right: 2px solid;
    border-bottom: 2px solid;
    border-color: ${e=>e.secondary||"#fff"};
    bottom: 6px;
    left: 6px;
    height: 10px;
    width: 6px;
  }
`,U=N("div")`
  position: absolute;
`,V=N("div")`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 20px;
  min-height: 20px;
`,X=_`
from {
  transform: scale(0.6);
  opacity: 0.4;
}
to {
  transform: scale(1);
  opacity: 1;
}`,Y=N("div")`
  position: relative;
  transform: scale(0.6);
  opacity: 0.4;
  min-width: 20px;
  animation: ${X} 0.3s 0.12s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
`,ee=({toast:e})=>{let{icon:t,type:s,iconTheme:r}=e;return void 0!==t?"string"==typeof t?a.createElement(Y,null,t):t:"blank"===s?null:a.createElement(V,null,a.createElement(W,{...r}),"loading"!==s&&a.createElement(U,null,"error"===s?a.createElement(G,{...r}):a.createElement(Q,{...r})))},ae=e=>`\n0% {transform: translate3d(0,${-200*e}%,0) scale(.6); opacity:.5;}\n100% {transform: translate3d(0,0,0) scale(1); opacity:1;}\n`,te=e=>`\n0% {transform: translate3d(0,0,-1px) scale(1); opacity:1;}\n100% {transform: translate3d(0,${-150*e}%,-1px) scale(.6); opacity:0;}\n`,se=N("div")`
  display: flex;
  align-items: center;
  background: #fff;
  color: #363636;
  line-height: 1.3;
  will-change: transform;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1), 0 3px 3px rgba(0, 0, 0, 0.05);
  max-width: 350px;
  pointer-events: auto;
  padding: 8px 10px;
  border-radius: 8px;
`,re=N("div")`
  display: flex;
  justify-content: center;
  margin: 4px 10px;
  color: inherit;
  flex: 1 1 auto;
  white-space: pre-line;
`;a.memo(({toast:e,position:t,style:s,children:r})=>{let o=e.height?((e,a)=>{let t=e.includes("top")?1:-1,[s,r]=C()?["0%{opacity:0;} 100%{opacity:1;}","0%{opacity:1;} 100%{opacity:0;}"]:[ae(t),te(t)];return{animation:a?`${_(s)} 0.35s cubic-bezier(.21,1.02,.73,1) forwards`:`${_(r)} 0.4s forwards cubic-bezier(.06,.71,.55,1)`}})(e.position||t||"top-center",e.visible):{opacity:0},l=a.createElement(ee,{toast:e}),i=a.createElement(re,{...e.ariaProps},w(e.message,e));return a.createElement(se,{className:e.className,style:{...o,...s,...e.style}},"function"==typeof r?r({icon:l,message:i}):a.createElement(a.Fragment,null,l,i))}),O=a.createElement,y.p=z,m=O,u=B,p=M,j`
  z-index: 9999;
  > * {
    pointer-events: auto;
  }
`;var oe=D;const le=({onSuccess:t,onClose:s,data:l})=>{const[i,n]=a.useState(!1),[d,m]=a.useState(""),[u,p]=a.useState(""),[v,f]=a.useState(""),[g,b]=a.useState(""),[y,h]=a.useState(""),[x,j]=a.useState([]),[_,N]=a.useState(""),[w,S]=a.useState(""),[C,E]=a.useState("half_day"),[L,k]=a.useState("confirmation"),[$,A]=a.useState(""),[I,q]=a.useState(""),[F,T]=a.useState(""),[D,O]=a.useState(!0),[z,B]=a.useState(!1),[M,P]=a.useState(!0),[H,R]=a.useState({name:!1,code:!1,category:!1}),G=[{value:"statutory",label:"Statutory"},{value:"non_statutory",label:"Non Statutory"},{value:"custom",label:"Custom"}],J=[{value:"joining",label:"Days After Joining"},{value:"confirmation",label:"Confirmation Date"}],W=[{value:"staff",label:"Staff"},{value:"contract",label:"Contract"},{value:"intern",label:"Intern"}],Z=[{value:"na",label:"Not Applicable"},{value:"all",label:"All"},{value:"female",label:"Female"},{value:"male",label:"Male"},{value:"other",label:"Other"}];a.useEffect(()=>{l?(m(l.name||""),p(l.leave_validation_type||""),f(l.allocation_validation_type||""),b(l.requires_allocation||""),h(l.employee_requests||""),j(l.responsible_ids||[]),N(l.leave_type_code||""),S(l.leave_category||""),k(l.eligible_after||l.eligiable_after||"confirmation"),A(l.eligiable_after_days??""),q(l.employee_category||""),T(l.gender_restriction||l.gender_restrication||""),E(l.request_unit||"half_day"),O(l.include_public_holidays_in_duration??!0),B(l.overtime_deductible??!1),P(l.is_earned_leave??!0)):K()},[l]);const K=()=>{m(""),p(""),f(""),b(""),h(""),j([]),k("confirmation"),A(""),q(""),T(""),N(""),S(""),E("half_day"),O(!0),B(!1),P(!0),R({name:!1,code:!1,category:!1})};a.useEffect(()=>{const e=document.getElementById("add_leave_type_modal"),a=()=>{K(),s&&s()};return e&&e.addEventListener("hidden.bs.modal",a),()=>{e&&e.removeEventListener("hidden.bs.modal",a)}},[]);const Q=(e,a,t,s=50)=>{const r=e.target.value.replace(/^\s+/,"");r.length>s||(a(r),H[t]&&R(e=>({...e,[t]:!1})))},U=(e,a,t=!1)=>e?a?t?"border border-success rounded":"is-valid":t?"border border-danger rounded":"is-invalid":"";return e.jsx("div",{className:"modal custom-modal fade",id:"add_leave_type_modal",role:"dialog",children:e.jsx("div",{className:"modal-dialog modal-dialog-centered modal-lg",children:e.jsxs("div",{className:"modal-content border-0 shadow-lg",children:[e.jsxs("div",{className:"modal-header border-bottom bg-light py-2",children:[e.jsxs("h5",{className:"modal-title fw-bold fs-15",children:[e.jsx("i",{className:"ti ti-calendar-time me-2 text-primary"}),l?"Edit Leave Type":"Add Leave Type"]}),e.jsx("button",{type:"button",className:"btn-close","data-bs-dismiss":"modal",id:"close-btn-leave-type","aria-label":"Close",children:e.jsx("span",{"aria-hidden":"true",children:"×"})})]}),e.jsxs("div",{className:"modal-body p-4",children:[e.jsxs("div",{className:"row g-3",children:[e.jsx("div",{className:"col-md-6",children:e.jsxs("div",{className:"form-group",children:[e.jsxs("label",{className:"form-label fs-13 fw-bold",children:["Name ",e.jsx("span",{className:"text-danger",children:"*"})]}),e.jsx("input",{type:"text",className:`form-control ${U(H.name,d)}`,value:d,onChange:e=>Q(e,m,"name",50),onBlur:()=>R({...H,name:!0}),maxLength:50,placeholder:"Enter leave type name"}),H.name&&!d&&e.jsx("div",{className:"invalid-feedback",children:"Name is required"})]})}),e.jsx("div",{className:"col-md-6",children:e.jsxs("div",{className:"form-group",children:[e.jsxs("label",{className:"form-label fs-13 fw-bold",children:["Leave Type Code ",e.jsx("span",{className:"text-danger",children:"*"})]}),e.jsx("input",{type:"text",className:`form-control ${U(H.code,_)}`,value:_,onChange:e=>Q(e,N,"code",20),onBlur:()=>R({...H,code:!0}),maxLength:10,placeholder:"e.g. SL, CL, PL"}),H.code&&!_&&e.jsx("div",{className:"invalid-feedback",children:"Leave Type Code is required"})]})}),e.jsx("div",{className:"col-md-6",children:e.jsxs("div",{className:"form-group",children:[e.jsxs("label",{className:"form-label fs-13 fw-bold",children:["Leave Category ",e.jsx("span",{className:"text-danger",children:"*"})]}),e.jsx("div",{className:U(H.category,w,!0),children:e.jsx(c,{options:G,placeholder:"Select Category",value:G.find(e=>e.value===w),onChange:e=>{S((null==e?void 0:e.value)||""),R({...H,category:!0})}})}),H.category&&!w&&e.jsx("div",{className:"text-danger fs-11 mt-1",children:"Leave Category is required"})]})}),e.jsxs("div",{className:"col-md-6",children:[e.jsx("label",{className:"form-label fs-13 fw-bold",children:"Eligibility Based On"}),e.jsx(c,{options:J,value:J.find(e=>e.value===L)||(L?{value:L,label:L}:void 0),onChange:e=>k((null==e?void 0:e.value)||"")})]}),e.jsxs("div",{className:"col-md-6",children:[e.jsx("label",{className:"form-label fs-13 fw-bold",children:"Wait Period (Days)"}),e.jsx("input",{type:"number",className:"form-control",value:$,onChange:e=>((e,a,t)=>{let s=e.target.value.replace(/\D/g,"");if(""===s)return e.target.value="",void a("");let r=parseInt(s,10);r>t&&(r=t),e.target.value=r.toString(),a(r)})(e,A,365),placeholder:"Enter days"})]}),e.jsxs("div",{className:"col-md-6",children:[e.jsx("label",{className:"form-label fs-13 fw-bold",children:"Applicable Employee Category"}),e.jsx(c,{options:W,value:W.find(e=>e.value===I),onChange:e=>q((null==e?void 0:e.value)||"")})]}),e.jsxs("div",{className:"col-md-6",children:[e.jsx("label",{className:"form-label fs-13 fw-bold",children:"Gender Applicability"}),e.jsx(c,{options:Z,value:Z.find(e=>e.value===F),onChange:e=>T((null==e?void 0:e.value)||"")})]})]}),e.jsxs("div",{className:"modal-footer border-0 px-0 mt-4 pb-0",children:[e.jsx("button",{type:"button",className:"btn btn-light me-2",onClick:K,children:"Reset"}),e.jsx("button",{className:"btn btn-primary px-4",onClick:async()=>{var e;if(R({name:!0,code:!0,category:!0}),d&&_&&w){n(!0);try{const a={name:d,leave_validation_type:u||void 0,allocation_validation_type:v||void 0,requires_allocation:g||void 0,employee_requests:y||void 0,responsible_ids:x.length>0?x:void 0,leave_type_code:_,leave_category:w,request_unit:C||void 0,include_public_holidays_in_duration:D,overtime_deductible:z,is_earned_leave:M,eligiable_after:L||void 0,eligible_after:L||void 0,eligiable_after_days:$?Number($):0,employee_category:I||void 0,gender_restrication:F||void 0,gender_restriction:F||void 0};l&&l.id?(await r(l.id,a),oe.success("Leave type updated.")):(await o(a),oe.success("Leave type created.")),null==(e=document.getElementById("close-btn-leave-type"))||e.click(),t()}catch(a){oe.error("Failed to save leave type.")}finally{n(!1)}}else oe.error("Please fill all required fields.")},disabled:i,children:i?e.jsxs(e.Fragment,{children:[e.jsx("span",{className:"spinner-border spinner-border-sm me-2",role:"status","aria-hidden":"true"}),"Saving..."]}):"Save Leave Type"})]})]})]})})})},ie=()=>{const r=s,[o,c]=a.useState([]),[m,u]=a.useState(null),p=async()=>{try{const e=(await n()).data||[];c(e)}catch(e){c([])}};a.useEffect(()=>{p()},[]);const v=[{title:"Name",dataIndex:"name",render:a=>e.jsx("span",{children:a?String(a):"-"}),sorter:(e,a)=>String((null==e?void 0:e.name)??"").localeCompare(String((null==a?void 0:a.name)??""))},{title:"Leave Type Code",dataIndex:"leave_type_code",render:a=>e.jsx("span",{children:a?String(a):"-"}),sorter:(e,a)=>String((null==e?void 0:e.leave_type_code)??"").localeCompare(String((null==a?void 0:a.leave_type_code)??""))},{title:"Leave Category",dataIndex:"leave_category",render:a=>e.jsx("span",{children:a?String(a):"-"}),sorter:(e,a)=>String((null==e?void 0:e.leave_category)??"").localeCompare(String((null==a?void 0:a.leave_category)??""))},{title:"Actions",dataIndex:"id",render:(a,s)=>e.jsxs("div",{className:"action-icon d-inline-flex",children:[e.jsx(t,{to:"#",className:"me-2","data-bs-toggle":"modal","data-bs-target":"#add_leave_type_modal",onClick:()=>u(s),children:e.jsx("i",{className:"ti ti-edit text-blue"})}),e.jsx(t,{to:"#",className:"me-2",onClick:()=>(async e=>{if(window.confirm("Are you sure you want to delete this leave type?"))try{await d(e),p()}catch(a){alert("Failed to delete leave type.")}})(s.id),children:e.jsx("i",{className:"ti ti-trash text-danger"})})]})}];return e.jsx(e.Fragment,{children:e.jsxs("div",{className:"main-wrapper",children:[e.jsx("div",{className:"page-wrapper",children:e.jsxs("div",{className:"content",children:[e.jsx("div",{onClick:()=>u(null),children:e.jsx(l,{title:"Leave ",parentMenu:"HR",activeMenu:"Leave Admin",routes:r,buttonText:"Add Leave",modalTarget:"#add_leave_type_modal"})}),e.jsx(i,{columns:v,data:o})]})}),e.jsx(le,{onSuccess:p,onClose:()=>u(null),data:m})]})})};export{ie as default};
