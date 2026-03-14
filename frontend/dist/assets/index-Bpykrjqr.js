(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))r(i);new MutationObserver(i=>{for(const n of i)if(n.type==="childList")for(const o of n.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&r(o)}).observe(document,{childList:!0,subtree:!0});function t(i){const n={};return i.integrity&&(n.integrity=i.integrity),i.referrerPolicy&&(n.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?n.credentials="include":i.crossOrigin==="anonymous"?n.credentials="omit":n.credentials="same-origin",n}function r(i){if(i.ep)return;i.ep=!0;const n=t(i);fetch(i.href,n)}})();/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const ye=globalThis,He=ye.ShadowRoot&&(ye.ShadyCSS===void 0||ye.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,Fe=Symbol(),et=new WeakMap;let bt=class{constructor(e,t,r){if(this._$cssResult$=!0,r!==Fe)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=t}get styleSheet(){let e=this.o;const t=this.t;if(He&&e===void 0){const r=t!==void 0&&t.length===1;r&&(e=et.get(t)),e===void 0&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),r&&et.set(t,e))}return e}toString(){return this.cssText}};const qt=s=>new bt(typeof s=="string"?s:s+"",void 0,Fe),T=(s,...e)=>{const t=s.length===1?s[0]:e.reduce((r,i,n)=>r+(o=>{if(o._$cssResult$===!0)return o.cssText;if(typeof o=="number")return o;throw Error("Value passed to 'css' function must be a 'css' function result: "+o+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+s[n+1],s[0]);return new bt(t,s,Fe)},zt=(s,e)=>{if(He)s.adoptedStyleSheets=e.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet);else for(const t of e){const r=document.createElement("style"),i=ye.litNonce;i!==void 0&&r.setAttribute("nonce",i),r.textContent=t.cssText,s.appendChild(r)}},tt=He?s=>s:s=>s instanceof CSSStyleSheet?(e=>{let t="";for(const r of e.cssRules)t+=r.cssText;return qt(t)})(s):s;/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const{is:Mt,defineProperty:Ut,getOwnPropertyDescriptor:It,getOwnPropertyNames:Vt,getOwnPropertySymbols:Ht,getPrototypeOf:Ft}=Object,N=globalThis,rt=N.trustedTypes,Jt=rt?rt.emptyScript:"",Re=N.reactiveElementPolyfillSupport,ne=(s,e)=>s,$e={toAttribute(s,e){switch(e){case Boolean:s=s?Jt:null;break;case Object:case Array:s=s==null?s:JSON.stringify(s)}return s},fromAttribute(s,e){let t=s;switch(e){case Boolean:t=s!==null;break;case Number:t=s===null?null:Number(s);break;case Object:case Array:try{t=JSON.parse(s)}catch{t=null}}return t}},Je=(s,e)=>!Mt(s,e),st={attribute:!0,type:String,converter:$e,reflect:!1,useDefault:!1,hasChanged:Je};Symbol.metadata??(Symbol.metadata=Symbol("metadata")),N.litPropertyMetadata??(N.litPropertyMetadata=new WeakMap);let W=class extends HTMLElement{static addInitializer(e){this._$Ei(),(this.l??(this.l=[])).push(e)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(e,t=st){if(t.state&&(t.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(e)&&((t=Object.create(t)).wrapped=!0),this.elementProperties.set(e,t),!t.noAccessor){const r=Symbol(),i=this.getPropertyDescriptor(e,r,t);i!==void 0&&Ut(this.prototype,e,i)}}static getPropertyDescriptor(e,t,r){const{get:i,set:n}=It(this.prototype,e)??{get(){return this[t]},set(o){this[t]=o}};return{get:i,set(o){const a=i==null?void 0:i.call(this);n==null||n.call(this,o),this.requestUpdate(e,a,r)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)??st}static _$Ei(){if(this.hasOwnProperty(ne("elementProperties")))return;const e=Ft(this);e.finalize(),e.l!==void 0&&(this.l=[...e.l]),this.elementProperties=new Map(e.elementProperties)}static finalize(){if(this.hasOwnProperty(ne("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(ne("properties"))){const t=this.properties,r=[...Vt(t),...Ht(t)];for(const i of r)this.createProperty(i,t[i])}const e=this[Symbol.metadata];if(e!==null){const t=litPropertyMetadata.get(e);if(t!==void 0)for(const[r,i]of t)this.elementProperties.set(r,i)}this._$Eh=new Map;for(const[t,r]of this.elementProperties){const i=this._$Eu(t,r);i!==void 0&&this._$Eh.set(i,t)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(e){const t=[];if(Array.isArray(e)){const r=new Set(e.flat(1/0).reverse());for(const i of r)t.unshift(tt(i))}else e!==void 0&&t.push(tt(e));return t}static _$Eu(e,t){const r=t.attribute;return r===!1?void 0:typeof r=="string"?r:typeof e=="string"?e.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){var e;this._$ES=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$E_(),this.requestUpdate(),(e=this.constructor.l)==null||e.forEach(t=>t(this))}addController(e){var t;(this._$EO??(this._$EO=new Set)).add(e),this.renderRoot!==void 0&&this.isConnected&&((t=e.hostConnected)==null||t.call(e))}removeController(e){var t;(t=this._$EO)==null||t.delete(e)}_$E_(){const e=new Map,t=this.constructor.elementProperties;for(const r of t.keys())this.hasOwnProperty(r)&&(e.set(r,this[r]),delete this[r]);e.size>0&&(this._$Ep=e)}createRenderRoot(){const e=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return zt(e,this.constructor.elementStyles),e}connectedCallback(){var e;this.renderRoot??(this.renderRoot=this.createRenderRoot()),this.enableUpdating(!0),(e=this._$EO)==null||e.forEach(t=>{var r;return(r=t.hostConnected)==null?void 0:r.call(t)})}enableUpdating(e){}disconnectedCallback(){var e;(e=this._$EO)==null||e.forEach(t=>{var r;return(r=t.hostDisconnected)==null?void 0:r.call(t)})}attributeChangedCallback(e,t,r){this._$AK(e,r)}_$ET(e,t){var n;const r=this.constructor.elementProperties.get(e),i=this.constructor._$Eu(e,r);if(i!==void 0&&r.reflect===!0){const o=(((n=r.converter)==null?void 0:n.toAttribute)!==void 0?r.converter:$e).toAttribute(t,r.type);this._$Em=e,o==null?this.removeAttribute(i):this.setAttribute(i,o),this._$Em=null}}_$AK(e,t){var n,o;const r=this.constructor,i=r._$Eh.get(e);if(i!==void 0&&this._$Em!==i){const a=r.getPropertyOptions(i),c=typeof a.converter=="function"?{fromAttribute:a.converter}:((n=a.converter)==null?void 0:n.fromAttribute)!==void 0?a.converter:$e;this._$Em=i;const l=c.fromAttribute(t,a.type);this[i]=l??((o=this._$Ej)==null?void 0:o.get(i))??l,this._$Em=null}}requestUpdate(e,t,r,i=!1,n){var o;if(e!==void 0){const a=this.constructor;if(i===!1&&(n=this[e]),r??(r=a.getPropertyOptions(e)),!((r.hasChanged??Je)(n,t)||r.useDefault&&r.reflect&&n===((o=this._$Ej)==null?void 0:o.get(e))&&!this.hasAttribute(a._$Eu(e,r))))return;this.C(e,t,r)}this.isUpdatePending===!1&&(this._$ES=this._$EP())}C(e,t,{useDefault:r,reflect:i,wrapped:n},o){r&&!(this._$Ej??(this._$Ej=new Map)).has(e)&&(this._$Ej.set(e,o??t??this[e]),n!==!0||o!==void 0)||(this._$AL.has(e)||(this.hasUpdated||r||(t=void 0),this._$AL.set(e,t)),i===!0&&this._$Em!==e&&(this._$Eq??(this._$Eq=new Set)).add(e))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(t){Promise.reject(t)}const e=this.scheduleUpdate();return e!=null&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){var r;if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??(this.renderRoot=this.createRenderRoot()),this._$Ep){for(const[n,o]of this._$Ep)this[n]=o;this._$Ep=void 0}const i=this.constructor.elementProperties;if(i.size>0)for(const[n,o]of i){const{wrapped:a}=o,c=this[n];a!==!0||this._$AL.has(n)||c===void 0||this.C(n,void 0,o,c)}}let e=!1;const t=this._$AL;try{e=this.shouldUpdate(t),e?(this.willUpdate(t),(r=this._$EO)==null||r.forEach(i=>{var n;return(n=i.hostUpdate)==null?void 0:n.call(i)}),this.update(t)):this._$EM()}catch(i){throw e=!1,this._$EM(),i}e&&this._$AE(t)}willUpdate(e){}_$AE(e){var t;(t=this._$EO)==null||t.forEach(r=>{var i;return(i=r.hostUpdated)==null?void 0:i.call(r)}),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(e){return!0}update(e){this._$Eq&&(this._$Eq=this._$Eq.forEach(t=>this._$ET(t,this[t]))),this._$EM()}updated(e){}firstUpdated(e){}};W.elementStyles=[],W.shadowRootOptions={mode:"open"},W[ne("elementProperties")]=new Map,W[ne("finalized")]=new Map,Re==null||Re({ReactiveElement:W}),(N.reactiveElementVersions??(N.reactiveElementVersions=[])).push("2.1.2");/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const oe=globalThis,it=s=>s,ke=oe.trustedTypes,nt=ke?ke.createPolicy("lit-html",{createHTML:s=>s}):void 0,vt="$lit$",P=`lit$${Math.random().toFixed(9).slice(2)}$`,wt="?"+P,Wt=`<${wt}>`,V=document,ae=()=>V.createComment(""),ce=s=>s===null||typeof s!="object"&&typeof s!="function",We=Array.isArray,Gt=s=>We(s)||typeof(s==null?void 0:s[Symbol.iterator])=="function",Pe=`[ 	
\f\r]`,re=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,ot=/-->/g,at=/>/g,z=RegExp(`>|${Pe}(?:([^\\s"'>=/]+)(${Pe}*=${Pe}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),ct=/'/g,lt=/"/g,_t=/^(?:script|style|textarea|title)$/i,Yt=s=>(e,...t)=>({_$litType$:s,strings:e,values:t}),h=Yt(1),G=Symbol.for("lit-noChange"),m=Symbol.for("lit-nothing"),ht=new WeakMap,M=V.createTreeWalker(V,129);function $t(s,e){if(!We(s)||!s.hasOwnProperty("raw"))throw Error("invalid template strings array");return nt!==void 0?nt.createHTML(e):e}const Kt=(s,e)=>{const t=s.length-1,r=[];let i,n=e===2?"<svg>":e===3?"<math>":"",o=re;for(let a=0;a<t;a++){const c=s[a];let l,u,d=-1,b=0;for(;b<c.length&&(o.lastIndex=b,u=o.exec(c),u!==null);)b=o.lastIndex,o===re?u[1]==="!--"?o=ot:u[1]!==void 0?o=at:u[2]!==void 0?(_t.test(u[2])&&(i=RegExp("</"+u[2],"g")),o=z):u[3]!==void 0&&(o=z):o===z?u[0]===">"?(o=i??re,d=-1):u[1]===void 0?d=-2:(d=o.lastIndex-u[2].length,l=u[1],o=u[3]===void 0?z:u[3]==='"'?lt:ct):o===lt||o===ct?o=z:o===ot||o===at?o=re:(o=z,i=void 0);const _=o===z&&s[a+1].startsWith("/>")?" ":"";n+=o===re?c+Wt:d>=0?(r.push(l),c.slice(0,d)+vt+c.slice(d)+P+_):c+P+(d===-2?a:_)}return[$t(s,n+(s[t]||"<?>")+(e===2?"</svg>":e===3?"</math>":"")),r]};class le{constructor({strings:e,_$litType$:t},r){let i;this.parts=[];let n=0,o=0;const a=e.length-1,c=this.parts,[l,u]=Kt(e,t);if(this.el=le.createElement(l,r),M.currentNode=this.el.content,t===2||t===3){const d=this.el.content.firstChild;d.replaceWith(...d.childNodes)}for(;(i=M.nextNode())!==null&&c.length<a;){if(i.nodeType===1){if(i.hasAttributes())for(const d of i.getAttributeNames())if(d.endsWith(vt)){const b=u[o++],_=i.getAttribute(d).split(P),fe=/([.?@])?(.*)/.exec(b);c.push({type:1,index:n,name:fe[2],strings:_,ctor:fe[1]==="."?Qt:fe[1]==="?"?Zt:fe[1]==="@"?er:Ae}),i.removeAttribute(d)}else d.startsWith(P)&&(c.push({type:6,index:n}),i.removeAttribute(d));if(_t.test(i.tagName)){const d=i.textContent.split(P),b=d.length-1;if(b>0){i.textContent=ke?ke.emptyScript:"";for(let _=0;_<b;_++)i.append(d[_],ae()),M.nextNode(),c.push({type:2,index:++n});i.append(d[b],ae())}}}else if(i.nodeType===8)if(i.data===wt)c.push({type:2,index:n});else{let d=-1;for(;(d=i.data.indexOf(P,d+1))!==-1;)c.push({type:7,index:n}),d+=P.length-1}n++}}static createElement(e,t){const r=V.createElement("template");return r.innerHTML=e,r}}function Y(s,e,t=s,r){var o,a;if(e===G)return e;let i=r!==void 0?(o=t._$Co)==null?void 0:o[r]:t._$Cl;const n=ce(e)?void 0:e._$litDirective$;return(i==null?void 0:i.constructor)!==n&&((a=i==null?void 0:i._$AO)==null||a.call(i,!1),n===void 0?i=void 0:(i=new n(s),i._$AT(s,t,r)),r!==void 0?(t._$Co??(t._$Co=[]))[r]=i:t._$Cl=i),i!==void 0&&(e=Y(s,i._$AS(s,e.values),i,r)),e}class Xt{constructor(e,t){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=t}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){const{el:{content:t},parts:r}=this._$AD,i=((e==null?void 0:e.creationScope)??V).importNode(t,!0);M.currentNode=i;let n=M.nextNode(),o=0,a=0,c=r[0];for(;c!==void 0;){if(o===c.index){let l;c.type===2?l=new de(n,n.nextSibling,this,e):c.type===1?l=new c.ctor(n,c.name,c.strings,this,e):c.type===6&&(l=new tr(n,this,e)),this._$AV.push(l),c=r[++a]}o!==(c==null?void 0:c.index)&&(n=M.nextNode(),o++)}return M.currentNode=V,i}p(e){let t=0;for(const r of this._$AV)r!==void 0&&(r.strings!==void 0?(r._$AI(e,r,t),t+=r.strings.length-2):r._$AI(e[t])),t++}}class de{get _$AU(){var e;return((e=this._$AM)==null?void 0:e._$AU)??this._$Cv}constructor(e,t,r,i){this.type=2,this._$AH=m,this._$AN=void 0,this._$AA=e,this._$AB=t,this._$AM=r,this.options=i,this._$Cv=(i==null?void 0:i.isConnected)??!0}get parentNode(){let e=this._$AA.parentNode;const t=this._$AM;return t!==void 0&&(e==null?void 0:e.nodeType)===11&&(e=t.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,t=this){e=Y(this,e,t),ce(e)?e===m||e==null||e===""?(this._$AH!==m&&this._$AR(),this._$AH=m):e!==this._$AH&&e!==G&&this._(e):e._$litType$!==void 0?this.$(e):e.nodeType!==void 0?this.T(e):Gt(e)?this.k(e):this._(e)}O(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.O(e))}_(e){this._$AH!==m&&ce(this._$AH)?this._$AA.nextSibling.data=e:this.T(V.createTextNode(e)),this._$AH=e}$(e){var n;const{values:t,_$litType$:r}=e,i=typeof r=="number"?this._$AC(e):(r.el===void 0&&(r.el=le.createElement($t(r.h,r.h[0]),this.options)),r);if(((n=this._$AH)==null?void 0:n._$AD)===i)this._$AH.p(t);else{const o=new Xt(i,this),a=o.u(this.options);o.p(t),this.T(a),this._$AH=o}}_$AC(e){let t=ht.get(e.strings);return t===void 0&&ht.set(e.strings,t=new le(e)),t}k(e){We(this._$AH)||(this._$AH=[],this._$AR());const t=this._$AH;let r,i=0;for(const n of e)i===t.length?t.push(r=new de(this.O(ae()),this.O(ae()),this,this.options)):r=t[i],r._$AI(n),i++;i<t.length&&(this._$AR(r&&r._$AB.nextSibling,i),t.length=i)}_$AR(e=this._$AA.nextSibling,t){var r;for((r=this._$AP)==null?void 0:r.call(this,!1,!0,t);e!==this._$AB;){const i=it(e).nextSibling;it(e).remove(),e=i}}setConnected(e){var t;this._$AM===void 0&&(this._$Cv=e,(t=this._$AP)==null||t.call(this,e))}}class Ae{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,t,r,i,n){this.type=1,this._$AH=m,this._$AN=void 0,this.element=e,this.name=t,this._$AM=i,this.options=n,r.length>2||r[0]!==""||r[1]!==""?(this._$AH=Array(r.length-1).fill(new String),this.strings=r):this._$AH=m}_$AI(e,t=this,r,i){const n=this.strings;let o=!1;if(n===void 0)e=Y(this,e,t,0),o=!ce(e)||e!==this._$AH&&e!==G,o&&(this._$AH=e);else{const a=e;let c,l;for(e=n[0],c=0;c<n.length-1;c++)l=Y(this,a[r+c],t,c),l===G&&(l=this._$AH[c]),o||(o=!ce(l)||l!==this._$AH[c]),l===m?e=m:e!==m&&(e+=(l??"")+n[c+1]),this._$AH[c]=l}o&&!i&&this.j(e)}j(e){e===m?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??"")}}class Qt extends Ae{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===m?void 0:e}}class Zt extends Ae{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==m)}}class er extends Ae{constructor(e,t,r,i,n){super(e,t,r,i,n),this.type=5}_$AI(e,t=this){if((e=Y(this,e,t,0)??m)===G)return;const r=this._$AH,i=e===m&&r!==m||e.capture!==r.capture||e.once!==r.once||e.passive!==r.passive,n=e!==m&&(r===m||i);i&&this.element.removeEventListener(this.name,this,r),n&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){var t;typeof this._$AH=="function"?this._$AH.call(((t=this.options)==null?void 0:t.host)??this.element,e):this._$AH.handleEvent(e)}}class tr{constructor(e,t,r){this.element=e,this.type=6,this._$AN=void 0,this._$AM=t,this.options=r}get _$AU(){return this._$AM._$AU}_$AI(e){Y(this,e)}}const Ne=oe.litHtmlPolyfillSupport;Ne==null||Ne(le,de),(oe.litHtmlVersions??(oe.litHtmlVersions=[])).push("3.3.2");const rr=(s,e,t)=>{const r=(t==null?void 0:t.renderBefore)??e;let i=r._$litPart$;if(i===void 0){const n=(t==null?void 0:t.renderBefore)??null;r._$litPart$=i=new de(e.insertBefore(ae(),n),n,void 0,t??{})}return i._$AI(s),i};/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const I=globalThis;class v extends W{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){var t;const e=super.createRenderRoot();return(t=this.renderOptions).renderBefore??(t.renderBefore=e.firstChild),e}update(e){const t=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=rr(t,this.renderRoot,this.renderOptions)}connectedCallback(){var e;super.connectedCallback(),(e=this._$Do)==null||e.setConnected(!0)}disconnectedCallback(){var e;super.disconnectedCallback(),(e=this._$Do)==null||e.setConnected(!1)}render(){return G}}var yt;v._$litElement$=!0,v.finalized=!0,(yt=I.litElementHydrateSupport)==null||yt.call(I,{LitElement:v});const Be=I.litElementPolyfillSupport;Be==null||Be({LitElement:v});(I.litElementVersions??(I.litElementVersions=[])).push("4.2.2");/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const A=s=>(e,t)=>{t!==void 0?t.addInitializer(()=>{customElements.define(s,e)}):customElements.define(s,e)};/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const sr={attribute:!0,type:String,converter:$e,reflect:!1,hasChanged:Je},ir=(s=sr,e,t)=>{const{kind:r,metadata:i}=t;let n=globalThis.litPropertyMetadata.get(i);if(n===void 0&&globalThis.litPropertyMetadata.set(i,n=new Map),r==="setter"&&((s=Object.create(s)).wrapped=!0),n.set(t.name,s),r==="accessor"){const{name:o}=t;return{set(a){const c=e.get.call(this);e.set.call(this,a),this.requestUpdate(o,c,s,!0,a)},init(a){return a!==void 0&&this.C(o,void 0,s,a),a}}}if(r==="setter"){const{name:o}=t;return function(a){const c=this[o];e.call(this,a),this.requestUpdate(o,c,s,!0,a)}}throw Error("Unsupported decorator location: "+r)};function f(s){return(e,t)=>typeof t=="object"?ir(s,e,t):((r,i,n)=>{const o=i.hasOwnProperty(n);return i.constructor.createProperty(n,r),o?Object.getOwnPropertyDescriptor(i,n):void 0})(s,e,t)}/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */function w(s){return f({...s,state:!0,attribute:!1})}const S=Object.create(null);S.open="0";S.close="1";S.ping="2";S.pong="3";S.message="4";S.upgrade="5";S.noop="6";const be=Object.create(null);Object.keys(S).forEach(s=>{be[S[s]]=s});const qe={type:"error",data:"parser error"},kt=typeof Blob=="function"||typeof Blob<"u"&&Object.prototype.toString.call(Blob)==="[object BlobConstructor]",xt=typeof ArrayBuffer=="function",Tt=s=>typeof ArrayBuffer.isView=="function"?ArrayBuffer.isView(s):s&&s.buffer instanceof ArrayBuffer,Ge=({type:s,data:e},t,r)=>kt&&e instanceof Blob?t?r(e):dt(e,r):xt&&(e instanceof ArrayBuffer||Tt(e))?t?r(e):dt(new Blob([e]),r):r(S[s]+(e||"")),dt=(s,e)=>{const t=new FileReader;return t.onload=function(){const r=t.result.split(",")[1];e("b"+(r||""))},t.readAsDataURL(s)};function ut(s){return s instanceof Uint8Array?s:s instanceof ArrayBuffer?new Uint8Array(s):new Uint8Array(s.buffer,s.byteOffset,s.byteLength)}let Le;function nr(s,e){if(kt&&s.data instanceof Blob)return s.data.arrayBuffer().then(ut).then(e);if(xt&&(s.data instanceof ArrayBuffer||Tt(s.data)))return e(ut(s.data));Ge(s,!1,t=>{Le||(Le=new TextEncoder),e(Le.encode(t))})}const pt="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",ie=typeof Uint8Array>"u"?[]:new Uint8Array(256);for(let s=0;s<pt.length;s++)ie[pt.charCodeAt(s)]=s;const or=s=>{let e=s.length*.75,t=s.length,r,i=0,n,o,a,c;s[s.length-1]==="="&&(e--,s[s.length-2]==="="&&e--);const l=new ArrayBuffer(e),u=new Uint8Array(l);for(r=0;r<t;r+=4)n=ie[s.charCodeAt(r)],o=ie[s.charCodeAt(r+1)],a=ie[s.charCodeAt(r+2)],c=ie[s.charCodeAt(r+3)],u[i++]=n<<2|o>>4,u[i++]=(o&15)<<4|a>>2,u[i++]=(a&3)<<6|c&63;return l},ar=typeof ArrayBuffer=="function",Ye=(s,e)=>{if(typeof s!="string")return{type:"message",data:At(s,e)};const t=s.charAt(0);return t==="b"?{type:"message",data:cr(s.substring(1),e)}:be[t]?s.length>1?{type:be[t],data:s.substring(1)}:{type:be[t]}:qe},cr=(s,e)=>{if(ar){const t=or(s);return At(t,e)}else return{base64:!0,data:s}},At=(s,e)=>{switch(e){case"blob":return s instanceof Blob?s:new Blob([s]);case"arraybuffer":default:return s instanceof ArrayBuffer?s:s.buffer}},Et="",lr=(s,e)=>{const t=s.length,r=new Array(t);let i=0;s.forEach((n,o)=>{Ge(n,!1,a=>{r[o]=a,++i===t&&e(r.join(Et))})})},hr=(s,e)=>{const t=s.split(Et),r=[];for(let i=0;i<t.length;i++){const n=Ye(t[i],e);if(r.push(n),n.type==="error")break}return r};function dr(){return new TransformStream({transform(s,e){nr(s,t=>{const r=t.length;let i;if(r<126)i=new Uint8Array(1),new DataView(i.buffer).setUint8(0,r);else if(r<65536){i=new Uint8Array(3);const n=new DataView(i.buffer);n.setUint8(0,126),n.setUint16(1,r)}else{i=new Uint8Array(9);const n=new DataView(i.buffer);n.setUint8(0,127),n.setBigUint64(1,BigInt(r))}s.data&&typeof s.data!="string"&&(i[0]|=128),e.enqueue(i),e.enqueue(t)})}})}let De;function me(s){return s.reduce((e,t)=>e+t.length,0)}function ge(s,e){if(s[0].length===e)return s.shift();const t=new Uint8Array(e);let r=0;for(let i=0;i<e;i++)t[i]=s[0][r++],r===s[0].length&&(s.shift(),r=0);return s.length&&r<s[0].length&&(s[0]=s[0].slice(r)),t}function ur(s,e){De||(De=new TextDecoder);const t=[];let r=0,i=-1,n=!1;return new TransformStream({transform(o,a){for(t.push(o);;){if(r===0){if(me(t)<1)break;const c=ge(t,1);n=(c[0]&128)===128,i=c[0]&127,i<126?r=3:i===126?r=1:r=2}else if(r===1){if(me(t)<2)break;const c=ge(t,2);i=new DataView(c.buffer,c.byteOffset,c.length).getUint16(0),r=3}else if(r===2){if(me(t)<8)break;const c=ge(t,8),l=new DataView(c.buffer,c.byteOffset,c.length),u=l.getUint32(0);if(u>Math.pow(2,21)-1){a.enqueue(qe);break}i=u*Math.pow(2,32)+l.getUint32(4),r=3}else{if(me(t)<i)break;const c=ge(t,i);a.enqueue(Ye(n?c:De.decode(c),e)),r=0}if(i===0||i>s){a.enqueue(qe);break}}}})}const Ct=4;function y(s){if(s)return pr(s)}function pr(s){for(var e in y.prototype)s[e]=y.prototype[e];return s}y.prototype.on=y.prototype.addEventListener=function(s,e){return this._callbacks=this._callbacks||{},(this._callbacks["$"+s]=this._callbacks["$"+s]||[]).push(e),this};y.prototype.once=function(s,e){function t(){this.off(s,t),e.apply(this,arguments)}return t.fn=e,this.on(s,t),this};y.prototype.off=y.prototype.removeListener=y.prototype.removeAllListeners=y.prototype.removeEventListener=function(s,e){if(this._callbacks=this._callbacks||{},arguments.length==0)return this._callbacks={},this;var t=this._callbacks["$"+s];if(!t)return this;if(arguments.length==1)return delete this._callbacks["$"+s],this;for(var r,i=0;i<t.length;i++)if(r=t[i],r===e||r.fn===e){t.splice(i,1);break}return t.length===0&&delete this._callbacks["$"+s],this};y.prototype.emit=function(s){this._callbacks=this._callbacks||{};for(var e=new Array(arguments.length-1),t=this._callbacks["$"+s],r=1;r<arguments.length;r++)e[r-1]=arguments[r];if(t){t=t.slice(0);for(var r=0,i=t.length;r<i;++r)t[r].apply(this,e)}return this};y.prototype.emitReserved=y.prototype.emit;y.prototype.listeners=function(s){return this._callbacks=this._callbacks||{},this._callbacks["$"+s]||[]};y.prototype.hasListeners=function(s){return!!this.listeners(s).length};const Ee=typeof Promise=="function"&&typeof Promise.resolve=="function"?e=>Promise.resolve().then(e):(e,t)=>t(e,0),k=typeof self<"u"?self:typeof window<"u"?window:Function("return this")(),fr="arraybuffer";function St(s,...e){return e.reduce((t,r)=>(s.hasOwnProperty(r)&&(t[r]=s[r]),t),{})}const mr=k.setTimeout,gr=k.clearTimeout;function Ce(s,e){e.useNativeTimers?(s.setTimeoutFn=mr.bind(k),s.clearTimeoutFn=gr.bind(k)):(s.setTimeoutFn=k.setTimeout.bind(k),s.clearTimeoutFn=k.clearTimeout.bind(k))}const yr=1.33;function br(s){return typeof s=="string"?vr(s):Math.ceil((s.byteLength||s.size)*yr)}function vr(s){let e=0,t=0;for(let r=0,i=s.length;r<i;r++)e=s.charCodeAt(r),e<128?t+=1:e<2048?t+=2:e<55296||e>=57344?t+=3:(r++,t+=4);return t}function Ot(){return Date.now().toString(36).substring(3)+Math.random().toString(36).substring(2,5)}function wr(s){let e="";for(let t in s)s.hasOwnProperty(t)&&(e.length&&(e+="&"),e+=encodeURIComponent(t)+"="+encodeURIComponent(s[t]));return e}function _r(s){let e={},t=s.split("&");for(let r=0,i=t.length;r<i;r++){let n=t[r].split("=");e[decodeURIComponent(n[0])]=decodeURIComponent(n[1])}return e}class $r extends Error{constructor(e,t,r){super(e),this.description=t,this.context=r,this.type="TransportError"}}class Ke extends y{constructor(e){super(),this.writable=!1,Ce(this,e),this.opts=e,this.query=e.query,this.socket=e.socket,this.supportsBinary=!e.forceBase64}onError(e,t,r){return super.emitReserved("error",new $r(e,t,r)),this}open(){return this.readyState="opening",this.doOpen(),this}close(){return(this.readyState==="opening"||this.readyState==="open")&&(this.doClose(),this.onClose()),this}send(e){this.readyState==="open"&&this.write(e)}onOpen(){this.readyState="open",this.writable=!0,super.emitReserved("open")}onData(e){const t=Ye(e,this.socket.binaryType);this.onPacket(t)}onPacket(e){super.emitReserved("packet",e)}onClose(e){this.readyState="closed",super.emitReserved("close",e)}pause(e){}createUri(e,t={}){return e+"://"+this._hostname()+this._port()+this.opts.path+this._query(t)}_hostname(){const e=this.opts.hostname;return e.indexOf(":")===-1?e:"["+e+"]"}_port(){return this.opts.port&&(this.opts.secure&&Number(this.opts.port)!==443||!this.opts.secure&&Number(this.opts.port)!==80)?":"+this.opts.port:""}_query(e){const t=wr(e);return t.length?"?"+t:""}}class kr extends Ke{constructor(){super(...arguments),this._polling=!1}get name(){return"polling"}doOpen(){this._poll()}pause(e){this.readyState="pausing";const t=()=>{this.readyState="paused",e()};if(this._polling||!this.writable){let r=0;this._polling&&(r++,this.once("pollComplete",function(){--r||t()})),this.writable||(r++,this.once("drain",function(){--r||t()}))}else t()}_poll(){this._polling=!0,this.doPoll(),this.emitReserved("poll")}onData(e){const t=r=>{if(this.readyState==="opening"&&r.type==="open"&&this.onOpen(),r.type==="close")return this.onClose({description:"transport closed by the server"}),!1;this.onPacket(r)};hr(e,this.socket.binaryType).forEach(t),this.readyState!=="closed"&&(this._polling=!1,this.emitReserved("pollComplete"),this.readyState==="open"&&this._poll())}doClose(){const e=()=>{this.write([{type:"close"}])};this.readyState==="open"?e():this.once("open",e)}write(e){this.writable=!1,lr(e,t=>{this.doWrite(t,()=>{this.writable=!0,this.emitReserved("drain")})})}uri(){const e=this.opts.secure?"https":"http",t=this.query||{};return this.opts.timestampRequests!==!1&&(t[this.opts.timestampParam]=Ot()),!this.supportsBinary&&!t.sid&&(t.b64=1),this.createUri(e,t)}}let Rt=!1;try{Rt=typeof XMLHttpRequest<"u"&&"withCredentials"in new XMLHttpRequest}catch{}const xr=Rt;function Tr(){}class Ar extends kr{constructor(e){if(super(e),typeof location<"u"){const t=location.protocol==="https:";let r=location.port;r||(r=t?"443":"80"),this.xd=typeof location<"u"&&e.hostname!==location.hostname||r!==e.port}}doWrite(e,t){const r=this.request({method:"POST",data:e});r.on("success",t),r.on("error",(i,n)=>{this.onError("xhr post error",i,n)})}doPoll(){const e=this.request();e.on("data",this.onData.bind(this)),e.on("error",(t,r)=>{this.onError("xhr poll error",t,r)}),this.pollXhr=e}}class C extends y{constructor(e,t,r){super(),this.createRequest=e,Ce(this,r),this._opts=r,this._method=r.method||"GET",this._uri=t,this._data=r.data!==void 0?r.data:null,this._create()}_create(){var e;const t=St(this._opts,"agent","pfx","key","passphrase","cert","ca","ciphers","rejectUnauthorized","autoUnref");t.xdomain=!!this._opts.xd;const r=this._xhr=this.createRequest(t);try{r.open(this._method,this._uri,!0);try{if(this._opts.extraHeaders){r.setDisableHeaderCheck&&r.setDisableHeaderCheck(!0);for(let i in this._opts.extraHeaders)this._opts.extraHeaders.hasOwnProperty(i)&&r.setRequestHeader(i,this._opts.extraHeaders[i])}}catch{}if(this._method==="POST")try{r.setRequestHeader("Content-type","text/plain;charset=UTF-8")}catch{}try{r.setRequestHeader("Accept","*/*")}catch{}(e=this._opts.cookieJar)===null||e===void 0||e.addCookies(r),"withCredentials"in r&&(r.withCredentials=this._opts.withCredentials),this._opts.requestTimeout&&(r.timeout=this._opts.requestTimeout),r.onreadystatechange=()=>{var i;r.readyState===3&&((i=this._opts.cookieJar)===null||i===void 0||i.parseCookies(r.getResponseHeader("set-cookie"))),r.readyState===4&&(r.status===200||r.status===1223?this._onLoad():this.setTimeoutFn(()=>{this._onError(typeof r.status=="number"?r.status:0)},0))},r.send(this._data)}catch(i){this.setTimeoutFn(()=>{this._onError(i)},0);return}typeof document<"u"&&(this._index=C.requestsCount++,C.requests[this._index]=this)}_onError(e){this.emitReserved("error",e,this._xhr),this._cleanup(!0)}_cleanup(e){if(!(typeof this._xhr>"u"||this._xhr===null)){if(this._xhr.onreadystatechange=Tr,e)try{this._xhr.abort()}catch{}typeof document<"u"&&delete C.requests[this._index],this._xhr=null}}_onLoad(){const e=this._xhr.responseText;e!==null&&(this.emitReserved("data",e),this.emitReserved("success"),this._cleanup())}abort(){this._cleanup()}}C.requestsCount=0;C.requests={};if(typeof document<"u"){if(typeof attachEvent=="function")attachEvent("onunload",ft);else if(typeof addEventListener=="function"){const s="onpagehide"in k?"pagehide":"unload";addEventListener(s,ft,!1)}}function ft(){for(let s in C.requests)C.requests.hasOwnProperty(s)&&C.requests[s].abort()}const Er=(function(){const s=Pt({xdomain:!1});return s&&s.responseType!==null})();class Cr extends Ar{constructor(e){super(e);const t=e&&e.forceBase64;this.supportsBinary=Er&&!t}request(e={}){return Object.assign(e,{xd:this.xd},this.opts),new C(Pt,this.uri(),e)}}function Pt(s){const e=s.xdomain;try{if(typeof XMLHttpRequest<"u"&&(!e||xr))return new XMLHttpRequest}catch{}if(!e)try{return new k[["Active"].concat("Object").join("X")]("Microsoft.XMLHTTP")}catch{}}const Nt=typeof navigator<"u"&&typeof navigator.product=="string"&&navigator.product.toLowerCase()==="reactnative";class Sr extends Ke{get name(){return"websocket"}doOpen(){const e=this.uri(),t=this.opts.protocols,r=Nt?{}:St(this.opts,"agent","perMessageDeflate","pfx","key","passphrase","cert","ca","ciphers","rejectUnauthorized","localAddress","protocolVersion","origin","maxPayload","family","checkServerIdentity");this.opts.extraHeaders&&(r.headers=this.opts.extraHeaders);try{this.ws=this.createSocket(e,t,r)}catch(i){return this.emitReserved("error",i)}this.ws.binaryType=this.socket.binaryType,this.addEventListeners()}addEventListeners(){this.ws.onopen=()=>{this.opts.autoUnref&&this.ws._socket.unref(),this.onOpen()},this.ws.onclose=e=>this.onClose({description:"websocket connection closed",context:e}),this.ws.onmessage=e=>this.onData(e.data),this.ws.onerror=e=>this.onError("websocket error",e)}write(e){this.writable=!1;for(let t=0;t<e.length;t++){const r=e[t],i=t===e.length-1;Ge(r,this.supportsBinary,n=>{try{this.doWrite(r,n)}catch{}i&&Ee(()=>{this.writable=!0,this.emitReserved("drain")},this.setTimeoutFn)})}}doClose(){typeof this.ws<"u"&&(this.ws.onerror=()=>{},this.ws.close(),this.ws=null)}uri(){const e=this.opts.secure?"wss":"ws",t=this.query||{};return this.opts.timestampRequests&&(t[this.opts.timestampParam]=Ot()),this.supportsBinary||(t.b64=1),this.createUri(e,t)}}const je=k.WebSocket||k.MozWebSocket;class Or extends Sr{createSocket(e,t,r){return Nt?new je(e,t,r):t?new je(e,t):new je(e)}doWrite(e,t){this.ws.send(t)}}class Rr extends Ke{get name(){return"webtransport"}doOpen(){try{this._transport=new WebTransport(this.createUri("https"),this.opts.transportOptions[this.name])}catch(e){return this.emitReserved("error",e)}this._transport.closed.then(()=>{this.onClose()}).catch(e=>{this.onError("webtransport error",e)}),this._transport.ready.then(()=>{this._transport.createBidirectionalStream().then(e=>{const t=ur(Number.MAX_SAFE_INTEGER,this.socket.binaryType),r=e.readable.pipeThrough(t).getReader(),i=dr();i.readable.pipeTo(e.writable),this._writer=i.writable.getWriter();const n=()=>{r.read().then(({done:a,value:c})=>{a||(this.onPacket(c),n())}).catch(a=>{})};n();const o={type:"open"};this.query.sid&&(o.data=`{"sid":"${this.query.sid}"}`),this._writer.write(o).then(()=>this.onOpen())})})}write(e){this.writable=!1;for(let t=0;t<e.length;t++){const r=e[t],i=t===e.length-1;this._writer.write(r).then(()=>{i&&Ee(()=>{this.writable=!0,this.emitReserved("drain")},this.setTimeoutFn)})}}doClose(){var e;(e=this._transport)===null||e===void 0||e.close()}}const Pr={websocket:Or,webtransport:Rr,polling:Cr},Nr=/^(?:(?![^:@\/?#]+:[^:@\/]*@)(http|https|ws|wss):\/\/)?((?:(([^:@\/?#]*)(?::([^:@\/?#]*))?)?@)?((?:[a-f0-9]{0,4}:){2,7}[a-f0-9]{0,4}|[^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/,Br=["source","protocol","authority","userInfo","user","password","host","port","relative","path","directory","file","query","anchor"];function ze(s){if(s.length>8e3)throw"URI too long";const e=s,t=s.indexOf("["),r=s.indexOf("]");t!=-1&&r!=-1&&(s=s.substring(0,t)+s.substring(t,r).replace(/:/g,";")+s.substring(r,s.length));let i=Nr.exec(s||""),n={},o=14;for(;o--;)n[Br[o]]=i[o]||"";return t!=-1&&r!=-1&&(n.source=e,n.host=n.host.substring(1,n.host.length-1).replace(/;/g,":"),n.authority=n.authority.replace("[","").replace("]","").replace(/;/g,":"),n.ipv6uri=!0),n.pathNames=Lr(n,n.path),n.queryKey=Dr(n,n.query),n}function Lr(s,e){const t=/\/{2,9}/g,r=e.replace(t,"/").split("/");return(e.slice(0,1)=="/"||e.length===0)&&r.splice(0,1),e.slice(-1)=="/"&&r.splice(r.length-1,1),r}function Dr(s,e){const t={};return e.replace(/(?:^|&)([^&=]*)=?([^&]*)/g,function(r,i,n){i&&(t[i]=n)}),t}const Me=typeof addEventListener=="function"&&typeof removeEventListener=="function",ve=[];Me&&addEventListener("offline",()=>{ve.forEach(s=>s())},!1);class B extends y{constructor(e,t){if(super(),this.binaryType=fr,this.writeBuffer=[],this._prevBufferLen=0,this._pingInterval=-1,this._pingTimeout=-1,this._maxPayload=-1,this._pingTimeoutTime=1/0,e&&typeof e=="object"&&(t=e,e=null),e){const r=ze(e);t.hostname=r.host,t.secure=r.protocol==="https"||r.protocol==="wss",t.port=r.port,r.query&&(t.query=r.query)}else t.host&&(t.hostname=ze(t.host).host);Ce(this,t),this.secure=t.secure!=null?t.secure:typeof location<"u"&&location.protocol==="https:",t.hostname&&!t.port&&(t.port=this.secure?"443":"80"),this.hostname=t.hostname||(typeof location<"u"?location.hostname:"localhost"),this.port=t.port||(typeof location<"u"&&location.port?location.port:this.secure?"443":"80"),this.transports=[],this._transportsByName={},t.transports.forEach(r=>{const i=r.prototype.name;this.transports.push(i),this._transportsByName[i]=r}),this.opts=Object.assign({path:"/engine.io",agent:!1,withCredentials:!1,upgrade:!0,timestampParam:"t",rememberUpgrade:!1,addTrailingSlash:!0,rejectUnauthorized:!0,perMessageDeflate:{threshold:1024},transportOptions:{},closeOnBeforeunload:!1},t),this.opts.path=this.opts.path.replace(/\/$/,"")+(this.opts.addTrailingSlash?"/":""),typeof this.opts.query=="string"&&(this.opts.query=_r(this.opts.query)),Me&&(this.opts.closeOnBeforeunload&&(this._beforeunloadEventListener=()=>{this.transport&&(this.transport.removeAllListeners(),this.transport.close())},addEventListener("beforeunload",this._beforeunloadEventListener,!1)),this.hostname!=="localhost"&&(this._offlineEventListener=()=>{this._onClose("transport close",{description:"network connection lost"})},ve.push(this._offlineEventListener))),this.opts.withCredentials&&(this._cookieJar=void 0),this._open()}createTransport(e){const t=Object.assign({},this.opts.query);t.EIO=Ct,t.transport=e,this.id&&(t.sid=this.id);const r=Object.assign({},this.opts,{query:t,socket:this,hostname:this.hostname,secure:this.secure,port:this.port},this.opts.transportOptions[e]);return new this._transportsByName[e](r)}_open(){if(this.transports.length===0){this.setTimeoutFn(()=>{this.emitReserved("error","No transports available")},0);return}const e=this.opts.rememberUpgrade&&B.priorWebsocketSuccess&&this.transports.indexOf("websocket")!==-1?"websocket":this.transports[0];this.readyState="opening";const t=this.createTransport(e);t.open(),this.setTransport(t)}setTransport(e){this.transport&&this.transport.removeAllListeners(),this.transport=e,e.on("drain",this._onDrain.bind(this)).on("packet",this._onPacket.bind(this)).on("error",this._onError.bind(this)).on("close",t=>this._onClose("transport close",t))}onOpen(){this.readyState="open",B.priorWebsocketSuccess=this.transport.name==="websocket",this.emitReserved("open"),this.flush()}_onPacket(e){if(this.readyState==="opening"||this.readyState==="open"||this.readyState==="closing")switch(this.emitReserved("packet",e),this.emitReserved("heartbeat"),e.type){case"open":this.onHandshake(JSON.parse(e.data));break;case"ping":this._sendPacket("pong"),this.emitReserved("ping"),this.emitReserved("pong"),this._resetPingTimeout();break;case"error":const t=new Error("server error");t.code=e.data,this._onError(t);break;case"message":this.emitReserved("data",e.data),this.emitReserved("message",e.data);break}}onHandshake(e){this.emitReserved("handshake",e),this.id=e.sid,this.transport.query.sid=e.sid,this._pingInterval=e.pingInterval,this._pingTimeout=e.pingTimeout,this._maxPayload=e.maxPayload,this.onOpen(),this.readyState!=="closed"&&this._resetPingTimeout()}_resetPingTimeout(){this.clearTimeoutFn(this._pingTimeoutTimer);const e=this._pingInterval+this._pingTimeout;this._pingTimeoutTime=Date.now()+e,this._pingTimeoutTimer=this.setTimeoutFn(()=>{this._onClose("ping timeout")},e),this.opts.autoUnref&&this._pingTimeoutTimer.unref()}_onDrain(){this.writeBuffer.splice(0,this._prevBufferLen),this._prevBufferLen=0,this.writeBuffer.length===0?this.emitReserved("drain"):this.flush()}flush(){if(this.readyState!=="closed"&&this.transport.writable&&!this.upgrading&&this.writeBuffer.length){const e=this._getWritablePackets();this.transport.send(e),this._prevBufferLen=e.length,this.emitReserved("flush")}}_getWritablePackets(){if(!(this._maxPayload&&this.transport.name==="polling"&&this.writeBuffer.length>1))return this.writeBuffer;let t=1;for(let r=0;r<this.writeBuffer.length;r++){const i=this.writeBuffer[r].data;if(i&&(t+=br(i)),r>0&&t>this._maxPayload)return this.writeBuffer.slice(0,r);t+=2}return this.writeBuffer}_hasPingExpired(){if(!this._pingTimeoutTime)return!0;const e=Date.now()>this._pingTimeoutTime;return e&&(this._pingTimeoutTime=0,Ee(()=>{this._onClose("ping timeout")},this.setTimeoutFn)),e}write(e,t,r){return this._sendPacket("message",e,t,r),this}send(e,t,r){return this._sendPacket("message",e,t,r),this}_sendPacket(e,t,r,i){if(typeof t=="function"&&(i=t,t=void 0),typeof r=="function"&&(i=r,r=null),this.readyState==="closing"||this.readyState==="closed")return;r=r||{},r.compress=r.compress!==!1;const n={type:e,data:t,options:r};this.emitReserved("packetCreate",n),this.writeBuffer.push(n),i&&this.once("flush",i),this.flush()}close(){const e=()=>{this._onClose("forced close"),this.transport.close()},t=()=>{this.off("upgrade",t),this.off("upgradeError",t),e()},r=()=>{this.once("upgrade",t),this.once("upgradeError",t)};return(this.readyState==="opening"||this.readyState==="open")&&(this.readyState="closing",this.writeBuffer.length?this.once("drain",()=>{this.upgrading?r():e()}):this.upgrading?r():e()),this}_onError(e){if(B.priorWebsocketSuccess=!1,this.opts.tryAllTransports&&this.transports.length>1&&this.readyState==="opening")return this.transports.shift(),this._open();this.emitReserved("error",e),this._onClose("transport error",e)}_onClose(e,t){if(this.readyState==="opening"||this.readyState==="open"||this.readyState==="closing"){if(this.clearTimeoutFn(this._pingTimeoutTimer),this.transport.removeAllListeners("close"),this.transport.close(),this.transport.removeAllListeners(),Me&&(this._beforeunloadEventListener&&removeEventListener("beforeunload",this._beforeunloadEventListener,!1),this._offlineEventListener)){const r=ve.indexOf(this._offlineEventListener);r!==-1&&ve.splice(r,1)}this.readyState="closed",this.id=null,this.emitReserved("close",e,t),this.writeBuffer=[],this._prevBufferLen=0}}}B.protocol=Ct;class jr extends B{constructor(){super(...arguments),this._upgrades=[]}onOpen(){if(super.onOpen(),this.readyState==="open"&&this.opts.upgrade)for(let e=0;e<this._upgrades.length;e++)this._probe(this._upgrades[e])}_probe(e){let t=this.createTransport(e),r=!1;B.priorWebsocketSuccess=!1;const i=()=>{r||(t.send([{type:"ping",data:"probe"}]),t.once("packet",d=>{if(!r)if(d.type==="pong"&&d.data==="probe"){if(this.upgrading=!0,this.emitReserved("upgrading",t),!t)return;B.priorWebsocketSuccess=t.name==="websocket",this.transport.pause(()=>{r||this.readyState!=="closed"&&(u(),this.setTransport(t),t.send([{type:"upgrade"}]),this.emitReserved("upgrade",t),t=null,this.upgrading=!1,this.flush())})}else{const b=new Error("probe error");b.transport=t.name,this.emitReserved("upgradeError",b)}}))};function n(){r||(r=!0,u(),t.close(),t=null)}const o=d=>{const b=new Error("probe error: "+d);b.transport=t.name,n(),this.emitReserved("upgradeError",b)};function a(){o("transport closed")}function c(){o("socket closed")}function l(d){t&&d.name!==t.name&&n()}const u=()=>{t.removeListener("open",i),t.removeListener("error",o),t.removeListener("close",a),this.off("close",c),this.off("upgrading",l)};t.once("open",i),t.once("error",o),t.once("close",a),this.once("close",c),this.once("upgrading",l),this._upgrades.indexOf("webtransport")!==-1&&e!=="webtransport"?this.setTimeoutFn(()=>{r||t.open()},200):t.open()}onHandshake(e){this._upgrades=this._filterUpgrades(e.upgrades),super.onHandshake(e)}_filterUpgrades(e){const t=[];for(let r=0;r<e.length;r++)~this.transports.indexOf(e[r])&&t.push(e[r]);return t}}let qr=class extends jr{constructor(e,t={}){const r=typeof e=="object"?e:t;(!r.transports||r.transports&&typeof r.transports[0]=="string")&&(r.transports=(r.transports||["polling","websocket","webtransport"]).map(i=>Pr[i]).filter(i=>!!i)),super(e,r)}};function zr(s,e="",t){let r=s;t=t||typeof location<"u"&&location,s==null&&(s=t.protocol+"//"+t.host),typeof s=="string"&&(s.charAt(0)==="/"&&(s.charAt(1)==="/"?s=t.protocol+s:s=t.host+s),/^(https?|wss?):\/\//.test(s)||(typeof t<"u"?s=t.protocol+"//"+s:s="https://"+s),r=ze(s)),r.port||(/^(http|ws)$/.test(r.protocol)?r.port="80":/^(http|ws)s$/.test(r.protocol)&&(r.port="443")),r.path=r.path||"/";const n=r.host.indexOf(":")!==-1?"["+r.host+"]":r.host;return r.id=r.protocol+"://"+n+":"+r.port+e,r.href=r.protocol+"://"+n+(t&&t.port===r.port?"":":"+r.port),r}const Mr=typeof ArrayBuffer=="function",Ur=s=>typeof ArrayBuffer.isView=="function"?ArrayBuffer.isView(s):s.buffer instanceof ArrayBuffer,Bt=Object.prototype.toString,Ir=typeof Blob=="function"||typeof Blob<"u"&&Bt.call(Blob)==="[object BlobConstructor]",Vr=typeof File=="function"||typeof File<"u"&&Bt.call(File)==="[object FileConstructor]";function Xe(s){return Mr&&(s instanceof ArrayBuffer||Ur(s))||Ir&&s instanceof Blob||Vr&&s instanceof File}function we(s,e){if(!s||typeof s!="object")return!1;if(Array.isArray(s)){for(let t=0,r=s.length;t<r;t++)if(we(s[t]))return!0;return!1}if(Xe(s))return!0;if(s.toJSON&&typeof s.toJSON=="function"&&arguments.length===1)return we(s.toJSON(),!0);for(const t in s)if(Object.prototype.hasOwnProperty.call(s,t)&&we(s[t]))return!0;return!1}function Hr(s){const e=[],t=s.data,r=s;return r.data=Ue(t,e),r.attachments=e.length,{packet:r,buffers:e}}function Ue(s,e){if(!s)return s;if(Xe(s)){const t={_placeholder:!0,num:e.length};return e.push(s),t}else if(Array.isArray(s)){const t=new Array(s.length);for(let r=0;r<s.length;r++)t[r]=Ue(s[r],e);return t}else if(typeof s=="object"&&!(s instanceof Date)){const t={};for(const r in s)Object.prototype.hasOwnProperty.call(s,r)&&(t[r]=Ue(s[r],e));return t}return s}function Fr(s,e){return s.data=Ie(s.data,e),delete s.attachments,s}function Ie(s,e){if(!s)return s;if(s&&s._placeholder===!0){if(typeof s.num=="number"&&s.num>=0&&s.num<e.length)return e[s.num];throw new Error("illegal attachments")}else if(Array.isArray(s))for(let t=0;t<s.length;t++)s[t]=Ie(s[t],e);else if(typeof s=="object")for(const t in s)Object.prototype.hasOwnProperty.call(s,t)&&(s[t]=Ie(s[t],e));return s}const Jr=["connect","connect_error","disconnect","disconnecting","newListener","removeListener"];var p;(function(s){s[s.CONNECT=0]="CONNECT",s[s.DISCONNECT=1]="DISCONNECT",s[s.EVENT=2]="EVENT",s[s.ACK=3]="ACK",s[s.CONNECT_ERROR=4]="CONNECT_ERROR",s[s.BINARY_EVENT=5]="BINARY_EVENT",s[s.BINARY_ACK=6]="BINARY_ACK"})(p||(p={}));class Wr{constructor(e){this.replacer=e}encode(e){return(e.type===p.EVENT||e.type===p.ACK)&&we(e)?this.encodeAsBinary({type:e.type===p.EVENT?p.BINARY_EVENT:p.BINARY_ACK,nsp:e.nsp,data:e.data,id:e.id}):[this.encodeAsString(e)]}encodeAsString(e){let t=""+e.type;return(e.type===p.BINARY_EVENT||e.type===p.BINARY_ACK)&&(t+=e.attachments+"-"),e.nsp&&e.nsp!=="/"&&(t+=e.nsp+","),e.id!=null&&(t+=e.id),e.data!=null&&(t+=JSON.stringify(e.data,this.replacer)),t}encodeAsBinary(e){const t=Hr(e),r=this.encodeAsString(t.packet),i=t.buffers;return i.unshift(r),i}}class Qe extends y{constructor(e){super(),this.reviver=e}add(e){let t;if(typeof e=="string"){if(this.reconstructor)throw new Error("got plaintext data when reconstructing a packet");t=this.decodeString(e);const r=t.type===p.BINARY_EVENT;r||t.type===p.BINARY_ACK?(t.type=r?p.EVENT:p.ACK,this.reconstructor=new Gr(t),t.attachments===0&&super.emitReserved("decoded",t)):super.emitReserved("decoded",t)}else if(Xe(e)||e.base64)if(this.reconstructor)t=this.reconstructor.takeBinaryData(e),t&&(this.reconstructor=null,super.emitReserved("decoded",t));else throw new Error("got binary data when not reconstructing a packet");else throw new Error("Unknown type: "+e)}decodeString(e){let t=0;const r={type:Number(e.charAt(0))};if(p[r.type]===void 0)throw new Error("unknown packet type "+r.type);if(r.type===p.BINARY_EVENT||r.type===p.BINARY_ACK){const n=t+1;for(;e.charAt(++t)!=="-"&&t!=e.length;);const o=e.substring(n,t);if(o!=Number(o)||e.charAt(t)!=="-")throw new Error("Illegal attachments");r.attachments=Number(o)}if(e.charAt(t+1)==="/"){const n=t+1;for(;++t&&!(e.charAt(t)===","||t===e.length););r.nsp=e.substring(n,t)}else r.nsp="/";const i=e.charAt(t+1);if(i!==""&&Number(i)==i){const n=t+1;for(;++t;){const o=e.charAt(t);if(o==null||Number(o)!=o){--t;break}if(t===e.length)break}r.id=Number(e.substring(n,t+1))}if(e.charAt(++t)){const n=this.tryParse(e.substr(t));if(Qe.isPayloadValid(r.type,n))r.data=n;else throw new Error("invalid payload")}return r}tryParse(e){try{return JSON.parse(e,this.reviver)}catch{return!1}}static isPayloadValid(e,t){switch(e){case p.CONNECT:return mt(t);case p.DISCONNECT:return t===void 0;case p.CONNECT_ERROR:return typeof t=="string"||mt(t);case p.EVENT:case p.BINARY_EVENT:return Array.isArray(t)&&(typeof t[0]=="number"||typeof t[0]=="string"&&Jr.indexOf(t[0])===-1);case p.ACK:case p.BINARY_ACK:return Array.isArray(t)}}destroy(){this.reconstructor&&(this.reconstructor.finishedReconstruction(),this.reconstructor=null)}}class Gr{constructor(e){this.packet=e,this.buffers=[],this.reconPack=e}takeBinaryData(e){if(this.buffers.push(e),this.buffers.length===this.reconPack.attachments){const t=Fr(this.reconPack,this.buffers);return this.finishedReconstruction(),t}return null}finishedReconstruction(){this.reconPack=null,this.buffers=[]}}function mt(s){return Object.prototype.toString.call(s)==="[object Object]"}const Yr=Object.freeze(Object.defineProperty({__proto__:null,Decoder:Qe,Encoder:Wr,get PacketType(){return p}},Symbol.toStringTag,{value:"Module"}));function E(s,e,t){return s.on(e,t),function(){s.off(e,t)}}const Kr=Object.freeze({connect:1,connect_error:1,disconnect:1,disconnecting:1,newListener:1,removeListener:1});class Lt extends y{constructor(e,t,r){super(),this.connected=!1,this.recovered=!1,this.receiveBuffer=[],this.sendBuffer=[],this._queue=[],this._queueSeq=0,this.ids=0,this.acks={},this.flags={},this.io=e,this.nsp=t,r&&r.auth&&(this.auth=r.auth),this._opts=Object.assign({},r),this.io._autoConnect&&this.open()}get disconnected(){return!this.connected}subEvents(){if(this.subs)return;const e=this.io;this.subs=[E(e,"open",this.onopen.bind(this)),E(e,"packet",this.onpacket.bind(this)),E(e,"error",this.onerror.bind(this)),E(e,"close",this.onclose.bind(this))]}get active(){return!!this.subs}connect(){return this.connected?this:(this.subEvents(),this.io._reconnecting||this.io.open(),this.io._readyState==="open"&&this.onopen(),this)}open(){return this.connect()}send(...e){return e.unshift("message"),this.emit.apply(this,e),this}emit(e,...t){var r,i,n;if(Kr.hasOwnProperty(e))throw new Error('"'+e.toString()+'" is a reserved event name');if(t.unshift(e),this._opts.retries&&!this.flags.fromQueue&&!this.flags.volatile)return this._addToQueue(t),this;const o={type:p.EVENT,data:t};if(o.options={},o.options.compress=this.flags.compress!==!1,typeof t[t.length-1]=="function"){const u=this.ids++,d=t.pop();this._registerAckCallback(u,d),o.id=u}const a=(i=(r=this.io.engine)===null||r===void 0?void 0:r.transport)===null||i===void 0?void 0:i.writable,c=this.connected&&!(!((n=this.io.engine)===null||n===void 0)&&n._hasPingExpired());return this.flags.volatile&&!a||(c?(this.notifyOutgoingListeners(o),this.packet(o)):this.sendBuffer.push(o)),this.flags={},this}_registerAckCallback(e,t){var r;const i=(r=this.flags.timeout)!==null&&r!==void 0?r:this._opts.ackTimeout;if(i===void 0){this.acks[e]=t;return}const n=this.io.setTimeoutFn(()=>{delete this.acks[e];for(let a=0;a<this.sendBuffer.length;a++)this.sendBuffer[a].id===e&&this.sendBuffer.splice(a,1);t.call(this,new Error("operation has timed out"))},i),o=(...a)=>{this.io.clearTimeoutFn(n),t.apply(this,a)};o.withError=!0,this.acks[e]=o}emitWithAck(e,...t){return new Promise((r,i)=>{const n=(o,a)=>o?i(o):r(a);n.withError=!0,t.push(n),this.emit(e,...t)})}_addToQueue(e){let t;typeof e[e.length-1]=="function"&&(t=e.pop());const r={id:this._queueSeq++,tryCount:0,pending:!1,args:e,flags:Object.assign({fromQueue:!0},this.flags)};e.push((i,...n)=>(this._queue[0],i!==null?r.tryCount>this._opts.retries&&(this._queue.shift(),t&&t(i)):(this._queue.shift(),t&&t(null,...n)),r.pending=!1,this._drainQueue())),this._queue.push(r),this._drainQueue()}_drainQueue(e=!1){if(!this.connected||this._queue.length===0)return;const t=this._queue[0];t.pending&&!e||(t.pending=!0,t.tryCount++,this.flags=t.flags,this.emit.apply(this,t.args))}packet(e){e.nsp=this.nsp,this.io._packet(e)}onopen(){typeof this.auth=="function"?this.auth(e=>{this._sendConnectPacket(e)}):this._sendConnectPacket(this.auth)}_sendConnectPacket(e){this.packet({type:p.CONNECT,data:this._pid?Object.assign({pid:this._pid,offset:this._lastOffset},e):e})}onerror(e){this.connected||this.emitReserved("connect_error",e)}onclose(e,t){this.connected=!1,delete this.id,this.emitReserved("disconnect",e,t),this._clearAcks()}_clearAcks(){Object.keys(this.acks).forEach(e=>{if(!this.sendBuffer.some(r=>String(r.id)===e)){const r=this.acks[e];delete this.acks[e],r.withError&&r.call(this,new Error("socket has been disconnected"))}})}onpacket(e){if(e.nsp===this.nsp)switch(e.type){case p.CONNECT:e.data&&e.data.sid?this.onconnect(e.data.sid,e.data.pid):this.emitReserved("connect_error",new Error("It seems you are trying to reach a Socket.IO server in v2.x with a v3.x client, but they are not compatible (more information here: https://socket.io/docs/v3/migrating-from-2-x-to-3-0/)"));break;case p.EVENT:case p.BINARY_EVENT:this.onevent(e);break;case p.ACK:case p.BINARY_ACK:this.onack(e);break;case p.DISCONNECT:this.ondisconnect();break;case p.CONNECT_ERROR:this.destroy();const r=new Error(e.data.message);r.data=e.data.data,this.emitReserved("connect_error",r);break}}onevent(e){const t=e.data||[];e.id!=null&&t.push(this.ack(e.id)),this.connected?this.emitEvent(t):this.receiveBuffer.push(Object.freeze(t))}emitEvent(e){if(this._anyListeners&&this._anyListeners.length){const t=this._anyListeners.slice();for(const r of t)r.apply(this,e)}super.emit.apply(this,e),this._pid&&e.length&&typeof e[e.length-1]=="string"&&(this._lastOffset=e[e.length-1])}ack(e){const t=this;let r=!1;return function(...i){r||(r=!0,t.packet({type:p.ACK,id:e,data:i}))}}onack(e){const t=this.acks[e.id];typeof t=="function"&&(delete this.acks[e.id],t.withError&&e.data.unshift(null),t.apply(this,e.data))}onconnect(e,t){this.id=e,this.recovered=t&&this._pid===t,this._pid=t,this.connected=!0,this.emitBuffered(),this._drainQueue(!0),this.emitReserved("connect")}emitBuffered(){this.receiveBuffer.forEach(e=>this.emitEvent(e)),this.receiveBuffer=[],this.sendBuffer.forEach(e=>{this.notifyOutgoingListeners(e),this.packet(e)}),this.sendBuffer=[]}ondisconnect(){this.destroy(),this.onclose("io server disconnect")}destroy(){this.subs&&(this.subs.forEach(e=>e()),this.subs=void 0),this.io._destroy(this)}disconnect(){return this.connected&&this.packet({type:p.DISCONNECT}),this.destroy(),this.connected&&this.onclose("io client disconnect"),this}close(){return this.disconnect()}compress(e){return this.flags.compress=e,this}get volatile(){return this.flags.volatile=!0,this}timeout(e){return this.flags.timeout=e,this}onAny(e){return this._anyListeners=this._anyListeners||[],this._anyListeners.push(e),this}prependAny(e){return this._anyListeners=this._anyListeners||[],this._anyListeners.unshift(e),this}offAny(e){if(!this._anyListeners)return this;if(e){const t=this._anyListeners;for(let r=0;r<t.length;r++)if(e===t[r])return t.splice(r,1),this}else this._anyListeners=[];return this}listenersAny(){return this._anyListeners||[]}onAnyOutgoing(e){return this._anyOutgoingListeners=this._anyOutgoingListeners||[],this._anyOutgoingListeners.push(e),this}prependAnyOutgoing(e){return this._anyOutgoingListeners=this._anyOutgoingListeners||[],this._anyOutgoingListeners.unshift(e),this}offAnyOutgoing(e){if(!this._anyOutgoingListeners)return this;if(e){const t=this._anyOutgoingListeners;for(let r=0;r<t.length;r++)if(e===t[r])return t.splice(r,1),this}else this._anyOutgoingListeners=[];return this}listenersAnyOutgoing(){return this._anyOutgoingListeners||[]}notifyOutgoingListeners(e){if(this._anyOutgoingListeners&&this._anyOutgoingListeners.length){const t=this._anyOutgoingListeners.slice();for(const r of t)r.apply(this,e.data)}}}function Q(s){s=s||{},this.ms=s.min||100,this.max=s.max||1e4,this.factor=s.factor||2,this.jitter=s.jitter>0&&s.jitter<=1?s.jitter:0,this.attempts=0}Q.prototype.duration=function(){var s=this.ms*Math.pow(this.factor,this.attempts++);if(this.jitter){var e=Math.random(),t=Math.floor(e*this.jitter*s);s=(Math.floor(e*10)&1)==0?s-t:s+t}return Math.min(s,this.max)|0};Q.prototype.reset=function(){this.attempts=0};Q.prototype.setMin=function(s){this.ms=s};Q.prototype.setMax=function(s){this.max=s};Q.prototype.setJitter=function(s){this.jitter=s};class Ve extends y{constructor(e,t){var r;super(),this.nsps={},this.subs=[],e&&typeof e=="object"&&(t=e,e=void 0),t=t||{},t.path=t.path||"/socket.io",this.opts=t,Ce(this,t),this.reconnection(t.reconnection!==!1),this.reconnectionAttempts(t.reconnectionAttempts||1/0),this.reconnectionDelay(t.reconnectionDelay||1e3),this.reconnectionDelayMax(t.reconnectionDelayMax||5e3),this.randomizationFactor((r=t.randomizationFactor)!==null&&r!==void 0?r:.5),this.backoff=new Q({min:this.reconnectionDelay(),max:this.reconnectionDelayMax(),jitter:this.randomizationFactor()}),this.timeout(t.timeout==null?2e4:t.timeout),this._readyState="closed",this.uri=e;const i=t.parser||Yr;this.encoder=new i.Encoder,this.decoder=new i.Decoder,this._autoConnect=t.autoConnect!==!1,this._autoConnect&&this.open()}reconnection(e){return arguments.length?(this._reconnection=!!e,e||(this.skipReconnect=!0),this):this._reconnection}reconnectionAttempts(e){return e===void 0?this._reconnectionAttempts:(this._reconnectionAttempts=e,this)}reconnectionDelay(e){var t;return e===void 0?this._reconnectionDelay:(this._reconnectionDelay=e,(t=this.backoff)===null||t===void 0||t.setMin(e),this)}randomizationFactor(e){var t;return e===void 0?this._randomizationFactor:(this._randomizationFactor=e,(t=this.backoff)===null||t===void 0||t.setJitter(e),this)}reconnectionDelayMax(e){var t;return e===void 0?this._reconnectionDelayMax:(this._reconnectionDelayMax=e,(t=this.backoff)===null||t===void 0||t.setMax(e),this)}timeout(e){return arguments.length?(this._timeout=e,this):this._timeout}maybeReconnectOnOpen(){!this._reconnecting&&this._reconnection&&this.backoff.attempts===0&&this.reconnect()}open(e){if(~this._readyState.indexOf("open"))return this;this.engine=new qr(this.uri,this.opts);const t=this.engine,r=this;this._readyState="opening",this.skipReconnect=!1;const i=E(t,"open",function(){r.onopen(),e&&e()}),n=a=>{this.cleanup(),this._readyState="closed",this.emitReserved("error",a),e?e(a):this.maybeReconnectOnOpen()},o=E(t,"error",n);if(this._timeout!==!1){const a=this._timeout,c=this.setTimeoutFn(()=>{i(),n(new Error("timeout")),t.close()},a);this.opts.autoUnref&&c.unref(),this.subs.push(()=>{this.clearTimeoutFn(c)})}return this.subs.push(i),this.subs.push(o),this}connect(e){return this.open(e)}onopen(){this.cleanup(),this._readyState="open",this.emitReserved("open");const e=this.engine;this.subs.push(E(e,"ping",this.onping.bind(this)),E(e,"data",this.ondata.bind(this)),E(e,"error",this.onerror.bind(this)),E(e,"close",this.onclose.bind(this)),E(this.decoder,"decoded",this.ondecoded.bind(this)))}onping(){this.emitReserved("ping")}ondata(e){try{this.decoder.add(e)}catch(t){this.onclose("parse error",t)}}ondecoded(e){Ee(()=>{this.emitReserved("packet",e)},this.setTimeoutFn)}onerror(e){this.emitReserved("error",e)}socket(e,t){let r=this.nsps[e];return r?this._autoConnect&&!r.active&&r.connect():(r=new Lt(this,e,t),this.nsps[e]=r),r}_destroy(e){const t=Object.keys(this.nsps);for(const r of t)if(this.nsps[r].active)return;this._close()}_packet(e){const t=this.encoder.encode(e);for(let r=0;r<t.length;r++)this.engine.write(t[r],e.options)}cleanup(){this.subs.forEach(e=>e()),this.subs.length=0,this.decoder.destroy()}_close(){this.skipReconnect=!0,this._reconnecting=!1,this.onclose("forced close")}disconnect(){return this._close()}onclose(e,t){var r;this.cleanup(),(r=this.engine)===null||r===void 0||r.close(),this.backoff.reset(),this._readyState="closed",this.emitReserved("close",e,t),this._reconnection&&!this.skipReconnect&&this.reconnect()}reconnect(){if(this._reconnecting||this.skipReconnect)return this;const e=this;if(this.backoff.attempts>=this._reconnectionAttempts)this.backoff.reset(),this.emitReserved("reconnect_failed"),this._reconnecting=!1;else{const t=this.backoff.duration();this._reconnecting=!0;const r=this.setTimeoutFn(()=>{e.skipReconnect||(this.emitReserved("reconnect_attempt",e.backoff.attempts),!e.skipReconnect&&e.open(i=>{i?(e._reconnecting=!1,e.reconnect(),this.emitReserved("reconnect_error",i)):e.onreconnect()}))},t);this.opts.autoUnref&&r.unref(),this.subs.push(()=>{this.clearTimeoutFn(r)})}}onreconnect(){const e=this.backoff.attempts;this._reconnecting=!1,this.backoff.reset(),this.emitReserved("reconnect",e)}}const se={};function _e(s,e){typeof s=="object"&&(e=s,s=void 0),e=e||{};const t=zr(s,e.path||"/socket.io"),r=t.source,i=t.id,n=t.path,o=se[i]&&n in se[i].nsps,a=e.forceNew||e["force new connection"]||e.multiplex===!1||o;let c;return a?c=new Ve(r,e):(se[i]||(se[i]=new Ve(r,e)),c=se[i]),t.query&&!e.query&&(e.query=t.queryKey),c.socket(t.path,e)}Object.assign(_e,{Manager:Ve,Socket:Lt,io:_e,connect:_e});class Xr{constructor(){this.socket=null,this.callbacks={}}connect(e){this.callbacks=e,this.socket=_e({withCredentials:!0}),this.socket.on("game_state",t=>{var r,i;(i=(r=this.callbacks).onGameState)==null||i.call(r,t)}),this.socket.on("room_update",t=>{var r,i;(i=(r=this.callbacks).onRoomUpdate)==null||i.call(r,t)}),this.socket.on("round_ended",t=>{var r,i;(i=(r=this.callbacks).onRoundEnded)==null||i.call(r,t)}),this.socket.on("error",t=>{var r,i;(i=(r=this.callbacks).onError)==null||i.call(r,t)})}disconnect(){var e;(e=this.socket)==null||e.disconnect(),this.socket=null}joinRoom(e){var t;(t=this.socket)==null||t.emit("join_room",{room_code:e})}leaveRoom(e){var t;(t=this.socket)==null||t.emit("leave_room",{room_code:e})}toggleReady(e){var t;(t=this.socket)==null||t.emit("toggle_ready",{room_code:e})}playCards(e,t,r){var i;(i=this.socket)==null||i.emit("play_cards",{room_code:e,cards:t,draw_source:r})}endRound(e){var t;(t=this.socket)==null||t.emit("end_round",{room_code:e})}readyNextRound(e){var t;(t=this.socket)==null||t.emit("ready_next_round",{room_code:e})}}const U=new Xr,gt=["#8fd4ff","#ffadad","#ffe083","#afffaf","#d1aaff"];class Qr{constructor(){this.hand=[],this.handValue=null,this.opponents=[],this.pileTop="",this.deckCount=0,this.currentPlayer="",this.scores={},this.roundEnded=!1,this.gameOver=!1,this.winners=[],this.readyPlayers=[],this.turnTimer=0,this.playerName="",this.roomCode="",this.allPlayers=[],this.selectedOrder=[],this.drawSource=null,this.actionLog=[],this.roundData=null,this.lastActionId="",this.lastError="",this.listeners=new Set}subscribe(e){return this.listeners.add(e),()=>this.listeners.delete(e)}notify(){this.listeners.forEach(e=>e())}reset(){this.hand=[],this.handValue=null,this.opponents=[],this.pileTop="",this.deckCount=0,this.currentPlayer="",this.scores={},this.roundEnded=!1,this.gameOver=!1,this.winners=[],this.readyPlayers=[],this.turnTimer=0,this.allPlayers=[],this.selectedOrder=[],this.drawSource=null,this.actionLog=[],this.roundData=null,this.lastActionId="",this.lastError=""}connect(e,t){this.reset(),this.roomCode=e,this.playerName=t,U.connect({onGameState:r=>this.updateFromServer(r),onRoundEnded:r=>this.handleRoundEnded(r),onError:r=>console.error("Server error:",r.message)}),U.joinRoom(e)}disconnect(){U.leaveRoom(this.roomCode),U.disconnect()}updateFromServer(e){const t=e.players.find(r=>Array.isArray(r.hand));if(t){if(this.playerName=t.name,this.hand=t.hand,this.handValue=t.hand_value,this.allPlayers=e.players.map(r=>r.name),this.opponents=e.players.filter(r=>r.name!==t.name).map(r=>({name:r.name,cardCount:r.hand,score:r.score})),this.pileTop=e.pileTop,this.deckCount=e.deckCount,this.currentPlayer=e.currentPlayer,this.scores=e.scores,this.readyPlayers=e.readyPlayers,this.gameOver=e.gameOver,this.winners=e.winners,this.turnTimer=e.turnTimer??0,!e.roundEnded&&this.roundEnded&&(this.roundData=null,this.actionLog=[],this.lastActionId=""),this.roundEnded=e.roundEnded,e.lastAction){const r=JSON.stringify(e.lastAction);r!==this.lastActionId&&(this.lastActionId=r,this.addLogEntry(e.lastAction,e))}this.selectedOrder=this.selectedOrder.filter(r=>r<this.hand.length),this.notify()}}handleRoundEnded(e){this.roundData=e,this.notify()}addLogEntry(e,t){var i;const r={player:e.player,score:t.scores[e.player]??0,color:this.getPlayerColor(e.player),items:[]};if((i=e.played)!=null&&i.length&&r.items.push({type:"played",cards:e.played}),e.draw_source==="pile"&&e.drawn_card)r.items.push({type:"drew",cards:[e.drawn_card]});else if(e.draw_source==="deck"){const n=e.drawn_card||"🂠";r.items.push({type:"drew",cards:[n]})}this.actionLog=[...this.actionLog,r],this.actionLog.length>5&&(this.actionLog=this.actionLog.slice(1))}getPlayerColor(e){const t=this.allPlayers.indexOf(e);return gt[t%gt.length]}toggleCardSelection(e){const t=this.selectedOrder.indexOf(e);t!==-1?this.selectedOrder=[...this.selectedOrder.slice(0,t),...this.selectedOrder.slice(t+1)]:this.selectedOrder=[...this.selectedOrder,e],this.notify()}setDrawSource(e){this.drawSource=this.drawSource===e?null:e,this.notify()}async playCards(){if(!this.drawSource||this.selectedOrder.length===0)return null;const e=this.selectedOrder.map(t=>this.hand[t]);try{const t=await fetch(`/api/lobby/rooms/${this.roomCode}/play`,{method:"POST",headers:{"Content-Type":"application/json"},credentials:"include",body:JSON.stringify({cards:e,draw_source:this.drawSource})}),r=await t.json();return this.selectedOrder=[],this.drawSource=null,t.ok?(this.updateFromServer(r),null):(this.lastError=r.error||"Invalid move",this.notify(),this.lastError)}catch{return this.selectedOrder=[],this.drawSource=null,this.lastError="Network error",this.notify(),this.lastError}}async endRound(){try{const e=await fetch(`/api/lobby/rooms/${this.roomCode}/end-round`,{method:"POST",credentials:"include"}),t=await e.json();return e.ok?(t.round_data&&this.handleRoundEnded(t.round_data),t.state&&this.updateFromServer(t.state),null):t.error||"Could not end round"}catch{return"Network error"}}async readyNextRound(){try{const t=await(await fetch(`/api/lobby/rooms/${this.roomCode}/ready`,{method:"POST",credentials:"include"})).json();t.state&&this.updateFromServer(t.state),t.round_data&&this.handleRoundEnded(t.round_data)}catch{}}get isMyTurn(){return this.playerName===this.currentPlayer&&!this.roundEnded}get canEndRound(){return this.isMyTurn&&this.handValue!==null&&this.handValue<=5}}const g=new Qr;class Zr{constructor(){this.user=null,this.listeners=new Set}subscribe(e){return this.listeners.add(e),()=>this.listeners.delete(e)}notify(){this.listeners.forEach(e=>e())}get isLoggedIn(){return this.user!==null}get displayName(){var e;return((e=this.user)==null?void 0:e.display_name)??""}async checkSession(){try{const t=await(await fetch("/api/auth/me",{credentials:"include"})).json();this.user=t.user,this.notify()}catch{this.user=null,this.notify()}}async register(e,t,r){const i=await fetch("/api/auth/register",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({username:e,password:t,display_name:r}),credentials:"include"}),n=await i.json();if(!i.ok)throw new Error(n.error);return this.user=n.user,this.notify(),n.user}async login(e,t){const r=await fetch("/api/auth/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({username:e,password:t}),credentials:"include"}),i=await r.json();if(!r.ok)throw new Error(i.error);return this.user=i.user,this.notify(),i.user}async loginAsGuest(e){const t=await fetch("/api/auth/guest",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({display_name:e}),credentials:"include"}),r=await t.json();if(!t.ok)throw new Error(r.error);return this.user=r.user,this.notify(),r.user}async logout(){await fetch("/api/auth/logout",{method:"POST",credentials:"include"}),this.user=null,this.notify()}}const x=new Zr;var es=Object.defineProperty,ts=Object.getOwnPropertyDescriptor,Se=(s,e,t,r)=>{for(var i=r>1?void 0:r?ts(e,t):e,n=s.length-1,o;n>=0;n--)(o=s[n])&&(i=(r?o(e,t,i):o(i))||i);return r&&i&&es(e,t,i),i};let K=class extends v{constructor(){super(...arguments),this.mode="guest",this.error="",this.loading=!1}async handleSubmit(s){s.preventDefault(),this.error="",this.loading=!0;const e=s.target,t=new FormData(e);try{switch(this.mode){case"guest":await x.loginAsGuest(t.get("display_name"));break;case"login":await x.login(t.get("username"),t.get("password"));break;case"register":await x.register(t.get("username"),t.get("password"),t.get("display_name"));break}this.dispatchEvent(new CustomEvent("authenticated"))}catch(r){this.error=r.message||"Something went wrong"}this.loading=!1}render(){return h`
      <div class="overlay">
        <div class="modal">
          <h1>Sub-Five</h1>
          <p class="subtitle">A strategic card game</p>

          <div class="tabs">
            <button class="tab ${this.mode==="guest"?"active":""}" @click=${()=>{this.mode="guest",this.error=""}}>
              Quick Play
            </button>
            <button class="tab ${this.mode==="login"?"active":""}" @click=${()=>{this.mode="login",this.error=""}}>
              Sign In
            </button>
            <button class="tab ${this.mode==="register"?"active":""}" @click=${()=>{this.mode="register",this.error=""}}>
              Register
            </button>
          </div>

          ${this.error?h`<div class="error">${this.error}</div>`:""}

          ${this.mode==="guest"?h`
            <form @submit=${this.handleSubmit}>
              <div class="field">
                <label>Display Name</label>
                <input name="display_name" placeholder="Enter your name" maxlength="20" required autofocus />
              </div>
              <button type="submit" class="btn-guest" ?disabled=${this.loading}>
                ${this.loading?"Joining...":"Play as Guest"}
              </button>
              <p class="hint">No account needed. Stats won't be saved.</p>
            </form>
          `:""}

          ${this.mode==="login"?h`
            <form @submit=${this.handleSubmit}>
              <div class="field">
                <label>Username</label>
                <input name="username" placeholder="Username" required autofocus />
              </div>
              <div class="field">
                <label>Password</label>
                <input name="password" type="password" placeholder="Password" required />
              </div>
              <button type="submit" class="btn-login" ?disabled=${this.loading}>
                ${this.loading?"Signing in...":"Sign In"}
              </button>
            </form>
          `:""}

          ${this.mode==="register"?h`
            <form @submit=${this.handleSubmit}>
              <div class="field">
                <label>Username</label>
                <input name="username" placeholder="Choose a username" minlength="3" required autofocus />
              </div>
              <div class="field">
                <label>Display Name</label>
                <input name="display_name" placeholder="Name shown in-game" maxlength="20" required />
              </div>
              <div class="field">
                <label>Password</label>
                <input name="password" type="password" placeholder="Min 4 characters" minlength="4" required />
              </div>
              <button type="submit" class="btn-register" ?disabled=${this.loading}>
                ${this.loading?"Creating account...":"Create Account"}
              </button>
              <p class="hint">Accounts track your stats and leaderboard rank.</p>
            </form>
          `:""}
        </div>
      </div>
    `}};K.styles=T`
    :host { display: block; }

    .overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 200;
    }

    .modal {
      background: linear-gradient(135deg, #1a2332, #0f1923);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 1.5rem;
      padding: 3rem;
      width: 420px;
      max-width: 90vw;
      box-shadow: 0 25px 60px rgba(0, 0, 0, 0.5);
    }

    h1 {
      text-align: center;
      font-size: 2.5rem;
      font-weight: 800;
      margin: 0 0 0.3rem;
      background: linear-gradient(135deg, #4ade80, #22d3ee);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .subtitle {
      text-align: center;
      color: rgba(255, 255, 255, 0.5);
      font-size: 0.9rem;
      margin-bottom: 2rem;
    }

    .tabs {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1.5rem;
    }

    .tab {
      flex: 1;
      padding: 0.6rem;
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 0.5rem;
      background: transparent;
      color: rgba(255, 255, 255, 0.5);
      cursor: pointer;
      font-size: 0.9rem;
      font-weight: 500;
      transition: all 0.2s;
    }
    .tab:hover { border-color: rgba(255, 255, 255, 0.3); color: white; }
    .tab.active {
      background: rgba(74, 222, 128, 0.15);
      border-color: #4ade80;
      color: #4ade80;
    }

    form { display: flex; flex-direction: column; gap: 1rem; }

    label {
      font-size: 0.85rem;
      color: rgba(255, 255, 255, 0.6);
      font-weight: 500;
    }

    input {
      width: 100%;
      padding: 0.75rem 1rem;
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 0.5rem;
      background: rgba(0, 0, 0, 0.3);
      color: white;
      font-size: 1rem;
      box-sizing: border-box;
      transition: border-color 0.2s;
    }
    input:focus { outline: none; border-color: #4ade80; }
    input::placeholder { color: rgba(255, 255, 255, 0.3); }

    .field { display: flex; flex-direction: column; gap: 0.3rem; }

    button[type="submit"] {
      padding: 0.8rem;
      border: none;
      border-radius: 0.5rem;
      font-size: 1.1rem;
      font-weight: 700;
      cursor: pointer;
      transition: filter 0.15s;
      margin-top: 0.5rem;
    }
    button[type="submit"]:hover:not(:disabled) { filter: brightness(1.1); }
    button[type="submit"]:disabled { opacity: 0.5; cursor: wait; }

    .btn-guest {
      background: linear-gradient(135deg, #4ade80, #22c55e);
      color: #052e16;
    }
    .btn-login {
      background: linear-gradient(135deg, #60a5fa, #3b82f6);
      color: white;
    }
    .btn-register {
      background: linear-gradient(135deg, #a78bfa, #7c3aed);
      color: white;
    }

    .error {
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: #fca5a5;
      padding: 0.6rem 1rem;
      border-radius: 0.5rem;
      font-size: 0.9rem;
      text-align: center;
    }

    .hint {
      text-align: center;
      font-size: 0.8rem;
      color: rgba(255, 255, 255, 0.4);
      margin-top: 0.5rem;
    }
  `;Se([w()],K.prototype,"mode",2);Se([w()],K.prototype,"error",2);Se([w()],K.prototype,"loading",2);K=Se([A("auth-modal")],K);var rs=Object.defineProperty,ss=Object.getOwnPropertyDescriptor,ue=(s,e,t,r)=>{for(var i=r>1?void 0:r?ss(e,t):e,n=s.length-1,o;n>=0;n--)(o=s[n])&&(i=(r?o(e,t,i):o(i))||i);return r&&i&&rs(e,t,i),i};let H=class extends v{constructor(){super(...arguments),this.rooms=[],this.showAuth=!1,this.showCreate=!1,this._tick=0}connectedCallback(){super.connectedCallback(),this.unsubAuth=x.subscribe(()=>this._tick++),x.checkSession().then(()=>{x.isLoggedIn||(this.showAuth=!0)}),this.loadRooms(),this.refreshTimer=window.setInterval(()=>this.loadRooms(),3e3)}disconnectedCallback(){var s;super.disconnectedCallback(),this.refreshTimer&&clearInterval(this.refreshTimer),(s=this.unsubAuth)==null||s.call(this)}async loadRooms(){try{const s=await fetch("/api/lobby/rooms",{credentials:"include"});this.rooms=await s.json()}catch{}}async createRoom(){const e=await(await fetch("/api/lobby/rooms",{method:"POST",headers:{"Content-Type":"application/json"},credentials:"include"})).json();window.location.hash=`#/join/${e.code}`}async quickGame(){const e=await(await fetch("/api/dev/quick-game",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({bots:2,name:x.displayName||"Dev"}),credentials:"include"})).json();window.location.hash=`#/game/${e.code}`}async deleteRoom(s,e){e.stopPropagation(),await fetch(`/api/lobby/rooms/${s}`,{method:"DELETE",credentials:"include"}),this.loadRooms()}handleAuth(){this.showAuth=!1,this._tick++}async handleLogout(){await x.logout(),this.showAuth=!0}render(){const s=x.user;if(this.showAuth&&!s)return h`<auth-modal @authenticated=${this.handleAuth}></auth-modal>`;const e=this.rooms.filter(r=>!r.started),t=this.rooms.filter(r=>r.started);return h`
      <header>
        <span class="logo">Sub-Five</span>
        ${s?h`
          <div class="user-info">
            <span class="user-name">${s.display_name}</span>
            ${s.is_guest?h`<span class="user-badge">Guest</span>`:m}
            <button class="btn-logout" @click=${this.handleLogout}>Sign Out</button>
          </div>
        `:m}
      </header>

      <main>
        <div class="hero">
          <h1>Sub-Five</h1>
          <p>Play the card game. Get your hand under five. Don't get penalized.</p>
        </div>

        <div class="actions">
          <button class="btn-create" @click=${this.createRoom}>Create Game</button>
          <button class="btn-dev" @click=${this.quickGame}>Quick Play vs Bots</button>
        </div>

        <div class="rooms-section">
          <div class="rooms-header">
            <h2>Open Games</h2>
            <span class="room-count">${this.rooms.length} room${this.rooms.length!==1?"s":""}</span>
          </div>

          ${this.rooms.length===0?h`
            <div class="empty-state">
              <div class="icon">♠ ♥ ♦ ♣</div>
              <p>No games available. Create one to start playing!</p>
            </div>
          `:h`
            <div class="room-grid">
              ${e.map(r=>h`
                <div class="room-card" @click=${()=>window.location.hash=`#/join/${r.code}`}>
                  <div class="room-card-header">
                    <span class="room-code">${r.code}</span>
                    <span class="room-status waiting">${r.players.length}/${r.max_players}</span>
                  </div>
                  <div class="room-players">${r.players.join(", ")||"Empty"}</div>
                  <div class="room-actions">
                    <button class="btn-join">Join</button>
                    <button class="btn-delete" @click=${i=>this.deleteRoom(r.code,i)}>✕</button>
                  </div>
                </div>
              `)}
              ${t.map(r=>h`
                <div class="room-card" style="opacity: 0.6;">
                  <div class="room-card-header">
                    <span class="room-code">${r.code}</span>
                    <span class="room-status in-progress">In Progress</span>
                  </div>
                  <div class="room-players">${r.players.join(", ")}</div>
                </div>
              `)}
            </div>
          `}
        </div>
      </main>
    `}};H.styles=T`
    :host {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      color: white;
    }

    /* Header bar */
    header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.5rem 3rem;
      background: rgba(0, 0, 0, 0.2);
      backdrop-filter: blur(10px);
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    }

    .logo {
      font-size: 1.8rem;
      font-weight: 800;
      background: linear-gradient(135deg, #4ade80, #22d3ee);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .user-name {
      font-weight: 600;
      color: rgba(255, 255, 255, 0.8);
    }

    .user-badge {
      font-size: 0.7rem;
      padding: 0.15rem 0.5rem;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.1);
      color: rgba(255, 255, 255, 0.5);
    }

    /* Main content */
    main {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 3rem 2rem;
      max-width: 900px;
      margin: 0 auto;
      width: 100%;
      box-sizing: border-box;
    }

    .hero {
      text-align: center;
      margin-bottom: 3rem;
    }

    .hero h1 {
      font-size: 3.5rem;
      font-weight: 900;
      margin: 0;
      background: linear-gradient(135deg, #4ade80, #22d3ee);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .hero p {
      color: rgba(255, 255, 255, 0.5);
      font-size: 1.1rem;
      margin: 0.5rem 0 0;
    }

    /* Action buttons */
    .actions {
      display: flex;
      gap: 1rem;
      margin-bottom: 2.5rem;
      flex-wrap: wrap;
      justify-content: center;
    }

    button {
      padding: 0.75rem 2rem;
      border: none;
      border-radius: 0.6rem;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    button:hover { transform: translateY(-1px); filter: brightness(1.1); }

    .btn-create {
      background: linear-gradient(135deg, #4ade80, #22c55e);
      color: #052e16;
      font-size: 1.1rem;
      padding: 0.85rem 2.5rem;
    }

    .btn-dev {
      background: linear-gradient(135deg, #818cf8, #6366f1);
      color: white;
    }

    .btn-logout {
      background: transparent;
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: rgba(255, 255, 255, 0.6);
      padding: 0.5rem 1.2rem;
      font-size: 0.85rem;
    }
    .btn-logout:hover { border-color: rgba(255, 255, 255, 0.4); color: white; }

    /* Room list */
    .rooms-section {
      width: 100%;
    }

    .rooms-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .rooms-header h2 {
      font-size: 1.3rem;
      font-weight: 700;
      margin: 0;
      color: rgba(255, 255, 255, 0.8);
    }

    .room-count {
      font-size: 0.85rem;
      color: rgba(255, 255, 255, 0.4);
    }

    /* Room cards */
    .room-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1rem;
    }

    .room-card {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 0.75rem;
      padding: 1.25rem;
      transition: all 0.2s;
      cursor: pointer;
    }
    .room-card:hover {
      background: rgba(255, 255, 255, 0.07);
      border-color: rgba(74, 222, 128, 0.3);
      transform: translateY(-2px);
    }

    .room-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
    }

    .room-code {
      font-family: monospace;
      font-size: 1.1rem;
      font-weight: 700;
      color: #fbbf24;
    }

    .room-status {
      font-size: 0.75rem;
      padding: 0.2rem 0.6rem;
      border-radius: 999px;
    }
    .room-status.waiting {
      background: rgba(74, 222, 128, 0.15);
      color: #4ade80;
    }
    .room-status.in-progress {
      background: rgba(251, 191, 36, 0.15);
      color: #fbbf24;
    }

    .room-players {
      color: rgba(255, 255, 255, 0.6);
      font-size: 0.9rem;
    }

    .room-actions {
      display: flex;
      gap: 0.5rem;
      margin-top: 0.75rem;
    }

    .btn-join {
      background: linear-gradient(135deg, #60a5fa, #3b82f6);
      color: white;
      padding: 0.4rem 1.2rem;
      font-size: 0.85rem;
      flex: 1;
    }

    .btn-delete {
      background: rgba(239, 68, 68, 0.15);
      color: #fca5a5;
      padding: 0.4rem 0.75rem;
      font-size: 0.85rem;
    }
    .btn-delete:hover { background: rgba(239, 68, 68, 0.3); }

    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
      color: rgba(255, 255, 255, 0.4);
    }
    .empty-state .icon { font-size: 3rem; margin-bottom: 1rem; }
    .empty-state p { font-size: 1.1rem; }
  `;ue([w()],H.prototype,"rooms",2);ue([w()],H.prototype,"showAuth",2);ue([w()],H.prototype,"showCreate",2);ue([w()],H.prototype,"_tick",2);H=ue([A("lobby-page")],H);var is=Object.defineProperty,ns=Object.getOwnPropertyDescriptor,Z=(s,e,t,r)=>{for(var i=r>1?void 0:r?ns(e,t):e,n=s.length-1,o;n>=0;n--)(o=s[n])&&(i=(r?o(e,t,i):o(i))||i);return r&&i&&is(e,t,i),i};let L=class extends v{constructor(){super(...arguments),this.roomCode="",this.joined=!1,this.players=[],this.ready={},this.error=""}connectedCallback(){super.connectedCallback(),x.isLoggedIn&&this.autoJoin(),this.startPolling()}disconnectedCallback(){super.disconnectedCallback(),this.pollTimer&&clearTimeout(this.pollTimer)}async autoJoin(){const s=x.displayName;if(!s)return;(await fetch(`/api/lobby/rooms/${this.roomCode}/join`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:s}),credentials:"include"})).ok&&(this.joined=!0)}async startPolling(){try{const s=await fetch(`/api/lobby/rooms/${this.roomCode}/state`,{credentials:"include"});if(!s.ok){window.location.hash="#/";return}const e=await s.json();if(this.players=e.players||[],this.ready=e.ready||{},e.started){window.location.hash=`#/game/${this.roomCode}`;return}}catch{}this.pollTimer=window.setTimeout(()=>this.startPolling(),1e3)}async handleJoin(s){s.preventDefault();const e=this.shadowRoot.querySelector("input"),t=e==null?void 0:e.value.trim();if(!t)return;const r=await fetch(`/api/lobby/rooms/${this.roomCode}/join`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:t}),credentials:"include"});if(!r.ok){const i=await r.json();this.error=i.error||"Could not join";return}this.joined=!0,this.error=""}handleReady(){U.connect({onRoomUpdate:s=>{this.players=s.players,this.ready=s.ready,s.started&&(window.location.hash=`#/game/${this.roomCode}`)}}),U.joinRoom(this.roomCode),U.toggleReady(this.roomCode)}async handleLeave(){await fetch(`/api/lobby/rooms/${this.roomCode}/leave`,{method:"POST",credentials:"include"}),window.location.hash="#/"}render(){const s=x.displayName,e=this.ready[s]??!1,t=this.players.length>=2&&this.players.every(r=>this.ready[r]);return h`
      <header>
        <button class="back-btn" @click=${()=>window.location.hash="#/"}>← Back</button>
        <span class="logo">Sub-Five</span>
        <span></span>
      </header>

      <main>
        <div class="card">
          <h2>Game Room</h2>
          <div class="room-code">${this.roomCode}</div>

          ${!this.joined&&!s?h`
            <form @submit=${this.handleJoin}>
              <input type="text" placeholder="Your display name" maxlength="20" autofocus />
              <button type="submit" class="btn-join-submit">Join Room</button>
              ${this.error?h`<div class="error">${this.error}</div>`:""}
            </form>
          `:h`
            <ul class="player-list">
              ${this.players.map(r=>h`
                <li>
                  <span class="player-name">${r}${r===s?" (you)":""}</span>
                  <span class="ready-badge ${this.ready[r]?"yes":"no"}">
                    ${this.ready[r]?"✓ Ready":"Waiting"}
                  </span>
                </li>
              `)}
            </ul>

            <div class="buttons">
              <button
                class="btn-ready ${e?"active":""}"
                @click=${this.handleReady}
              >
                ${e?"Cancel Ready":"I'm Ready"}
              </button>
              <button class="btn-leave" @click=${this.handleLeave}>Leave</button>
            </div>

            ${this.players.length<2?h`
              <p class="waiting-msg">Waiting for more players<span class="dots"></span></p>
            `:t?h`
              <p class="waiting-msg">Starting game...</p>
            `:h`
              <p class="waiting-msg">Waiting for everyone to ready up<span class="dots"></span></p>
            `}
          `}
        </div>
      </main>
    `}};L.styles=T`
    :host {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }

    header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.5rem 3rem;
      background: rgba(0, 0, 0, 0.2);
      backdrop-filter: blur(10px);
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    }

    .back-btn {
      background: transparent;
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: rgba(255, 255, 255, 0.7);
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
      cursor: pointer;
      font-size: 0.9rem;
    }
    .back-btn:hover { border-color: rgba(255,255,255,0.4); color: white; }

    .logo {
      font-size: 1.4rem;
      font-weight: 800;
      background: linear-gradient(135deg, #4ade80, #22d3ee);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    main {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }

    .card {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 1.25rem;
      padding: 2.5rem 3rem;
      width: 440px;
      max-width: 90vw;
    }

    h2 {
      text-align: center;
      font-size: 1.6rem;
      font-weight: 700;
      margin: 0 0 0.5rem;
    }

    .room-code {
      text-align: center;
      font-family: monospace;
      font-size: 2rem;
      font-weight: 800;
      color: #fbbf24;
      text-shadow: 0 0 20px rgba(251, 191, 36, 0.3);
      margin-bottom: 2rem;
      letter-spacing: 0.2em;
    }

    /* Player list */
    .player-list {
      list-style: none;
      padding: 0;
      margin: 0 0 1.5rem;
    }

    .player-list li {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem 1rem;
      border-radius: 0.5rem;
      margin-bottom: 0.3rem;
      background: rgba(255, 255, 255, 0.03);
      transition: background 0.2s;
    }

    .player-name { font-weight: 600; font-size: 1.05rem; }

    .ready-badge {
      font-size: 0.8rem;
      padding: 0.2rem 0.7rem;
      border-radius: 999px;
    }
    .ready-badge.yes {
      background: rgba(74, 222, 128, 0.15);
      color: #4ade80;
    }
    .ready-badge.no {
      background: rgba(255, 255, 255, 0.06);
      color: rgba(255, 255, 255, 0.4);
    }

    /* Buttons */
    .buttons {
      display: flex;
      gap: 0.75rem;
    }

    button {
      padding: 0.7rem 1.5rem;
      border: none;
      border-radius: 0.5rem;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      flex: 1;
    }
    button:hover { transform: translateY(-1px); filter: brightness(1.1); }

    .btn-ready {
      background: linear-gradient(135deg, #4ade80, #22c55e);
      color: #052e16;
    }
    .btn-ready.active {
      background: linear-gradient(135deg, #fb923c, #f97316);
      color: white;
    }

    .btn-leave {
      background: rgba(239, 68, 68, 0.15);
      color: #fca5a5;
      flex: 0;
      padding: 0.7rem 1.2rem;
    }

    /* Join form */
    form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    input {
      padding: 0.75rem 1rem;
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 0.5rem;
      background: rgba(0, 0, 0, 0.3);
      color: white;
      font-size: 1.1rem;
      text-align: center;
    }
    input:focus { outline: none; border-color: #4ade80; }
    input::placeholder { color: rgba(255, 255, 255, 0.3); }

    .btn-join-submit {
      background: linear-gradient(135deg, #4ade80, #22c55e);
      color: #052e16;
    }

    .error {
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: #fca5a5;
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
      font-size: 0.9rem;
      text-align: center;
    }

    .waiting-msg {
      text-align: center;
      color: rgba(255, 255, 255, 0.4);
      font-size: 0.9rem;
      margin-top: 1rem;
    }

    .waiting-msg .dots::after {
      content: '';
      animation: dots 1.5s infinite;
    }
    @keyframes dots {
      0% { content: '.'; }
      33% { content: '..'; }
      66% { content: '...'; }
    }
  `;Z([f()],L.prototype,"roomCode",2);Z([w()],L.prototype,"joined",2);Z([w()],L.prototype,"players",2);Z([w()],L.prototype,"ready",2);Z([w()],L.prototype,"error",2);L=Z([A("join-page")],L);class os{constructor(){this.ctx=null,this._muted=!1,this._volume=.5}get muted(){return this._muted}set muted(e){this._muted=e}get volume(){return this._volume}set volume(e){this._volume=Math.max(0,Math.min(1,e))}getCtx(){return this.ctx||(this.ctx=new AudioContext),this.ctx.state==="suspended"&&this.ctx.resume(),this.ctx}play(e){if(!this._muted)try{switch(e){case"card-play":this.playCardPlay();break;case"card-draw":this.playCardDraw();break;case"card-select":this.playCardSelect();break;case"card-deselect":this.playCardDeselect();break;case"shuffle":this.playShuffle();break;case"your-turn":this.playYourTurn();break;case"round-end":this.playRoundEnd();break;case"game-over":this.playGameOver();break;case"error":this.playError();break;case"button-click":this.playButtonClick();break;case"timer-warning":this.playTimerWarning();break;case"timer-danger":this.playTimerDanger();break}}catch{}}playCardPlay(){const e=this.getCtx(),t=e.currentTime,r=this._volume*.4,i=.08,n=e.sampleRate*i,o=e.createBuffer(1,n,e.sampleRate),a=o.getChannelData(0);for(let d=0;d<n;d++)a[d]=(Math.random()*2-1)*(1-d/n);const c=e.createBufferSource();c.buffer=o;const l=e.createBiquadFilter();l.type="bandpass",l.frequency.value=800,l.Q.value=1.5;const u=e.createGain();u.gain.setValueAtTime(r,t),u.gain.exponentialRampToValueAtTime(.001,t+i),c.connect(l).connect(u).connect(e.destination),c.start(t),c.stop(t+i)}playCardDraw(){const e=this.getCtx(),t=e.currentTime,r=this._volume*.25,i=.12,n=e.sampleRate*i,o=e.createBuffer(1,n,e.sampleRate),a=o.getChannelData(0);for(let d=0;d<n;d++)a[d]=(Math.random()*2-1)*Math.pow(1-d/n,2);const c=e.createBufferSource();c.buffer=o;const l=e.createBiquadFilter();l.type="highpass",l.frequency.value=2e3;const u=e.createGain();u.gain.setValueAtTime(r,t),u.gain.exponentialRampToValueAtTime(.001,t+i),c.connect(l).connect(u).connect(e.destination),c.start(t),c.stop(t+i)}playCardSelect(){const e=this.getCtx(),t=e.currentTime,r=this._volume*.15,i=e.createOscillator();i.type="sine",i.frequency.setValueAtTime(1200,t),i.frequency.exponentialRampToValueAtTime(1800,t+.04);const n=e.createGain();n.gain.setValueAtTime(r,t),n.gain.exponentialRampToValueAtTime(.001,t+.06),i.connect(n).connect(e.destination),i.start(t),i.stop(t+.06)}playCardDeselect(){const e=this.getCtx(),t=e.currentTime,r=this._volume*.12,i=e.createOscillator();i.type="sine",i.frequency.setValueAtTime(1e3,t),i.frequency.exponentialRampToValueAtTime(600,t+.05);const n=e.createGain();n.gain.setValueAtTime(r,t),n.gain.exponentialRampToValueAtTime(.001,t+.06),i.connect(n).connect(e.destination),i.start(t),i.stop(t+.06)}playShuffle(){const e=this.getCtx(),t=e.currentTime,r=this._volume*.2;for(let i=0;i<8;i++){const n=i*.05,o=.04,a=e.sampleRate*o,c=e.createBuffer(1,a,e.sampleRate),l=c.getChannelData(0);for(let _=0;_<a;_++)l[_]=(Math.random()*2-1)*(1-_/a);const u=e.createBufferSource();u.buffer=c;const d=e.createBiquadFilter();d.type="bandpass",d.frequency.value=600+i*100,d.Q.value=2;const b=e.createGain();b.gain.setValueAtTime(r*(.5+Math.random()*.5),t+n),b.gain.exponentialRampToValueAtTime(.001,t+n+o),u.connect(d).connect(b).connect(e.destination),u.start(t+n),u.stop(t+n+o)}}playYourTurn(){const e=this.getCtx(),t=e.currentTime,r=this._volume*.25;[660,880].forEach((n,o)=>{const a=e.createOscillator();a.type="sine",a.frequency.value=n;const c=e.createGain(),l=t+o*.12;c.gain.setValueAtTime(r,l),c.gain.exponentialRampToValueAtTime(.001,l+.2),a.connect(c).connect(e.destination),a.start(l),a.stop(l+.2)})}playRoundEnd(){const e=this.getCtx(),t=e.currentTime,r=this._volume*.3;[880,660,440,330].forEach((n,o)=>{const a=e.createOscillator();a.type="triangle",a.frequency.value=n;const c=e.createGain(),l=t+o*.15;c.gain.setValueAtTime(r,l),c.gain.exponentialRampToValueAtTime(.001,l+.3),a.connect(c).connect(e.destination),a.start(l),a.stop(l+.3)})}playGameOver(){const e=this.getCtx(),t=e.currentTime,r=this._volume*.3;[523,659,784,1047].forEach((n,o)=>{const a=e.createOscillator();a.type="triangle",a.frequency.value=n;const c=e.createGain(),l=t+o*.1;c.gain.setValueAtTime(0,l),c.gain.linearRampToValueAtTime(r,l+.05),c.gain.exponentialRampToValueAtTime(.001,l+.5),a.connect(c).connect(e.destination),a.start(l),a.stop(l+.5)})}playError(){const e=this.getCtx(),t=e.currentTime,r=this._volume*.2,i=e.createOscillator();i.type="sawtooth",i.frequency.value=150;const n=e.createGain();n.gain.setValueAtTime(r,t),n.gain.exponentialRampToValueAtTime(.001,t+.2);const o=e.createBiquadFilter();o.type="lowpass",o.frequency.value=400,i.connect(o).connect(n).connect(e.destination),i.start(t),i.stop(t+.2)}playButtonClick(){const e=this.getCtx(),t=e.currentTime,r=this._volume*.1,i=e.createOscillator();i.type="sine",i.frequency.value=800;const n=e.createGain();n.gain.setValueAtTime(r,t),n.gain.exponentialRampToValueAtTime(.001,t+.04),i.connect(n).connect(e.destination),i.start(t),i.stop(t+.04)}playTimerWarning(){const e=this.getCtx(),t=e.currentTime,r=this._volume*.15,i=e.createOscillator();i.type="sine",i.frequency.value=440;const n=e.createGain();n.gain.setValueAtTime(r,t),n.gain.exponentialRampToValueAtTime(.001,t+.15),i.connect(n).connect(e.destination),i.start(t),i.stop(t+.15)}playTimerDanger(){const e=this.getCtx(),t=e.currentTime,r=this._volume*.2;for(let i=0;i<2;i++){const n=e.createOscillator();n.type="square",n.frequency.value=880;const o=e.createGain(),a=t+i*.12;o.gain.setValueAtTime(r,a),o.gain.exponentialRampToValueAtTime(.001,a+.08);const c=e.createBiquadFilter();c.type="lowpass",c.frequency.value=2e3,n.connect(c).connect(o).connect(e.destination),n.start(a),n.stop(a+.08)}}}const $=new os;function as(s){return s.animate([{transform:"translateX(0)"},{transform:"translateX(-6px)"},{transform:"translateX(5px)"},{transform:"translateX(-4px)"},{transform:"translateX(3px)"},{transform:"translateX(0)"}],{duration:300,easing:"ease-in-out"}).finished.then(()=>{})}var cs=Object.defineProperty,ls=Object.getOwnPropertyDescriptor,J=(s,e,t,r)=>{for(var i=r>1?void 0:r?ls(e,t):e,n=s.length-1,o;n>=0;n--)(o=s[n])&&(i=(r?o(e,t,i):o(i))||i);return r&&i&&cs(e,t,i),i};const hs={A:"Ace",J:"Jack",Q:"Queen",K:"King",10:"10",9:"9",8:"8",7:"7",6:"6",5:"5",4:"4",3:"3",2:"2"},ds={"♠":"Spades","♥":"Hearts","♦":"Diamonds","♣":"Clubs"};let R=class extends v{constructor(){super(...arguments),this.card="",this.selected=!1,this.order=0,this.faceDown=!1,this.interactive=!1,this.mini=!1}parseCard(){return this.card.startsWith("JOKER")?{rank:"JOKER",suit:this.card.slice(-1),isJoker:!0}:this.card.startsWith("10")?{rank:"10",suit:this.card[2],isJoker:!1}:{rank:this.card[0],suit:this.card[1],isJoker:!1}}render(){if(this.faceDown||!this.card)return h`<playing-card cid="back"></playing-card>`;const{rank:s,suit:e,isJoker:t}=this.parseCard();if(t)return h`
        <div class="joker-card ${this.interactive?"":"not-interactive"}" data-joker=${e}>
          <div class="joker-face">JOKER${e}</div>
        </div>
        ${this.selected&&this.order>0?h`<div class="order-badge">${this.order}</div>`:m}
      `;const r=hs[s]||s,i=ds[e]||e;return h`
      <playing-card
        class="${this.interactive?"":"not-interactive"}"
        rank=${r}
        suit=${i}
      ></playing-card>
      ${this.selected&&this.order>0?h`<div class="order-badge">${this.order}</div>`:m}
    `}};R.styles=T`
    /* === Host is the transform target for selection/draw highlight === */
    :host {
      display: inline-block;
      position: relative;
      transition: transform 0.15s ease;
      flex-shrink: 0;
    }

    :host(.selected) {
      transform: scale(1.1);
      z-index: 1;
    }

    :host(.draw-selected) {
      transform: scale(1.3);
      z-index: 1;
    }

    /* === Card sizes === */
    playing-card,
    .joker-card {
      width: 7vw;
      height: calc(7vw * 1.39);
      display: inline-block;
      box-sizing: border-box;
      flex-shrink: 0;
      vertical-align: top;
    }

    :host([mini]) playing-card,
    :host([mini]) .joker-card {
      width: 2.5vw;
      height: calc(2.5vw * 1.39);
    }

    playing-card {
      shape-rendering: geometricPrecision;
      image-rendering: pixelated;
      will-change: transform;
    }

    /* === Joker card styling — matches original === */
    .joker-card {
      display: inline-flex;
      justify-content: center;
      align-items: center;
      background: white;
      border: 0.001vw solid #ccc;
      border-radius: 0.3vw;
      font-family: Arial, Helvetica, sans-serif;
      font-weight: bold;
      font-size: 1.2vw;
      color: black;
      text-align: center;
    }
    .joker-card[data-joker="♥"] { color: red; }

    .joker-face {
      width: 100%;
      font-size: 1.1vw;
      line-height: 1.1;
      text-transform: uppercase;
      white-space: nowrap;
    }
    :host([mini]) .joker-face { font-size: 0.6vw; }

    /* === Order badge === */
    .order-badge {
      position: absolute;
      top: -0.5vw;
      right: -0.5vw;
      width: 2vw;
      height: 2vw;
      background: orange;
      color: white;
      font-size: 1vw;
      font-weight: bold;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2;
    }
    :host([mini]) .order-badge { display: none; }

    .not-interactive { pointer-events: none; }
  `;J([f()],R.prototype,"card",2);J([f({type:Boolean})],R.prototype,"selected",2);J([f({type:Number})],R.prototype,"order",2);J([f({type:Boolean})],R.prototype,"faceDown",2);J([f({type:Boolean})],R.prototype,"interactive",2);J([f({type:Boolean})],R.prototype,"mini",2);R=J([A("card-element")],R);var us=Object.defineProperty,ps=Object.getOwnPropertyDescriptor,q=(s,e,t,r)=>{for(var i=r>1?void 0:r?ps(e,t):e,n=s.length-1,o;n>=0;n--)(o=s[n])&&(i=(r?o(e,t,i):o(i))||i);return r&&i&&us(e,t,i),i};let O=class extends v{constructor(){super(...arguments),this.cards=[],this.selectedOrder=[],this.interactive=!1,this.handValue=null,this.playerName="",this.score=0,this.isCurrentTurn=!1}handleCardClick(s){if(!this.interactive)return;const e=this.selectedOrder.includes(s);$.play(e?"card-deselect":"card-select"),g.toggleCardSelection(s)}render(){return h`
      <div class="player-hand-wrapper">
        <div class="player-label ${this.isCurrentTurn?"current-turn":""}">
          ${this.playerName} (${this.score})
        </div>
        <div class="player-hand">
          ${this.cards.map((s,e)=>{const t=this.selectedOrder.indexOf(e),r=t!==-1;return h`
              <card-element
                class=${r?"selected":""}
                .card=${s}
                .selected=${r}
                .order=${r?t+1:0}
                .interactive=${this.interactive}
                @click=${()=>this.handleCardClick(e)}
              ></card-element>
            `})}
        </div>
      </div>
    `}};O.styles=T`
    :host { display: block; }

    .player-hand-wrapper {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .player-label {
      font-size: 2vw;
      font-weight: bold;
      color: white;
      text-shadow: 0 0 1vw black;
      margin-bottom: 0.3vw;
      text-align: center;
      white-space: nowrap;
    }

    .player-label.current-turn {
      color: gold;
      text-shadow: 0 0 5px black, 0 0 10px gold;
    }

    .player-hand {
      display: flex;
      justify-content: center;
      align-items: flex-end;
      gap: 0.9vw;
    }

    card-element {
      cursor: pointer;
    }
  `;q([f({type:Array})],O.prototype,"cards",2);q([f({type:Array})],O.prototype,"selectedOrder",2);q([f({type:Boolean})],O.prototype,"interactive",2);q([f({type:Number})],O.prototype,"handValue",2);q([f()],O.prototype,"playerName",2);q([f({type:Number})],O.prototype,"score",2);q([f({type:Boolean})],O.prototype,"isCurrentTurn",2);O=q([A("card-hand")],O);var fs=Object.defineProperty,ms=Object.getOwnPropertyDescriptor,ee=(s,e,t,r)=>{for(var i=r>1?void 0:r?ms(e,t):e,n=s.length-1,o;n>=0;n--)(o=s[n])&&(i=(r?o(e,t,i):o(i))||i);return r&&i&&fs(e,t,i),i};let D=class extends v{constructor(){super(...arguments),this.name="",this.cardCount=0,this.score=0,this.isCurrentTurn=!1,this.position="top"}render(){const s=[];for(let e=0;e<this.cardCount;e++)s.push(h`<div class="card-back"></div>`);return h`
      <div class="opponent-box ${this.position}">
        <div class="opponent-hand">${s}</div>
        <div class="player-label ${this.isCurrentTurn?"current-turn":""}">
          ${this.name} (${this.score})
        </div>
      </div>
    `}};D.styles=T`
    :host { display: block; }

    .opponent-box {
      position: absolute;
      display: flex;
      flex-direction: column;
      align-items: center;
      z-index: 5;
      width: 15vw;
    }

    .opponent-box.top {
      top: 10%;
      left: 50%;
      transform: translateX(-50%);
    }

    .opponent-box.left {
      left: 0%;
      top: 50%;
      transform: translateY(-50%) rotate(-90deg);
      transform-origin: center;
    }

    .opponent-box.right {
      right: 0%;
      top: 50%;
      transform: translateY(-50%) rotate(90deg);
      transform-origin: center;
    }

    .player-label {
      font-size: 2vw;
      font-weight: bold;
      color: white;
      text-shadow: 0 0 1vw black;
      margin-top: 0.5vw;
      text-align: center;
      white-space: nowrap;
    }

    .player-label.current-turn {
      color: gold;
      text-shadow: 0 0 5px black, 0 0 10px gold;
    }

    .opponent-hand {
      display: flex;
      gap: 0.3vw;
    }

    .card-back {
      width: 2.5vw;
      height: calc(2.5vw * 1.39);
      border-radius: 2px;
      background: white url("/card-back.svg") center center / cover no-repeat;
      box-sizing: border-box;
    }
  `;ee([f()],D.prototype,"name",2);ee([f({type:Number})],D.prototype,"cardCount",2);ee([f({type:Number})],D.prototype,"score",2);ee([f({type:Boolean})],D.prototype,"isCurrentTurn",2);ee([f()],D.prototype,"position",2);D=ee([A("opponent-hand")],D);var gs=Object.defineProperty,ys=Object.getOwnPropertyDescriptor,te=(s,e,t,r)=>{for(var i=r>1?void 0:r?ys(e,t):e,n=s.length-1,o;n>=0;n--)(o=s[n])&&(i=(r?o(e,t,i):o(i))||i);return r&&i&&gs(e,t,i),i};let j=class extends v{constructor(){super(...arguments),this.pileTop="",this.deckCount=0,this.drawSource=null,this.lastPlayed=[],this.interactive=!1}handleDeckClick(){this.interactive&&($.play("card-select"),g.setDrawSource("deck"))}handlePileClick(){this.interactive&&($.play("card-select"),g.setDrawSource("pile"))}render(){const s=this.drawSource==="deck"?"draw-selected":"",e=this.drawSource==="pile"?"draw-selected":"";return h`
      <div class="deck-area ${this.interactive?"":"not-interactive"}"
           @click=${this.handleDeckClick}>
        <card-element class=${s} faceDown></card-element>
      </div>

      <div class="pile-area ${this.interactive?"":"not-interactive"}"
           @click=${this.handlePileClick}>
        ${this.lastPlayed.length>0?h`
              <div class="pile-card-stack">
                ${this.lastPlayed.map((t,r)=>{const n=r===this.lastPlayed.length-1?`top-played ${e}`:"";return h`
                    <card-element
                      class=${n}
                      style="left: ${r*30}%; z-index: ${r}"
                      .card=${t}
                    ></card-element>
                  `})}
              </div>
            `:h`
              <card-element
                class=${e}
                .card=${this.pileTop}
              ></card-element>
            `}
      </div>
    `}};j.styles=T`
    :host { display: contents; }

    .deck-area, .pile-area {
      position: absolute;
      top: 50%;
      transform: translate(-50%, -50%);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }

    .deck-area { left: 30%; }
    .pile-area { left: 70%; }

    .pile-card-stack {
      position: relative;
      height: calc(7vw * 1.39);
    }

    .pile-card-stack card-element {
      position: absolute;
      top: 0;
    }

    .not-interactive { pointer-events: none; }
  `;te([f()],j.prototype,"pileTop",2);te([f({type:Number})],j.prototype,"deckCount",2);te([f()],j.prototype,"drawSource",2);te([f({type:Array})],j.prototype,"lastPlayed",2);te([f({type:Boolean})],j.prototype,"interactive",2);j=te([A("deck-pile")],j);var bs=Object.defineProperty,vs=Object.getOwnPropertyDescriptor,Dt=(s,e,t,r)=>{for(var i=r>1?void 0:r?vs(e,t):e,n=s.length-1,o;n>=0;n--)(o=s[n])&&(i=(r?o(e,t,i):o(i))||i);return r&&i&&bs(e,t,i),i};let xe=class extends v{constructor(){super(...arguments),this.entries=[]}render(){return h`
      ${[...this.entries].reverse().map(s=>h`
          <div class="log-entry">
            <span class="name" style="color: ${s.color}">
              ${s.player} (${s.score})
            </span>
            ${s.items.map(e=>h`
                <div class="action-line">
                  <div>${e.type}:</div>
                  <div class="log-card-row">
                    ${e.cards.map(t=>h`<card-element mini .card=${t} .faceDown=${t==="🂠"}></card-element>`)}
                  </div>
                </div>
              `)}
          </div>
        `)}
    `}};xe.styles=T`
    :host {
      display: flex;
      flex-direction: column;
      gap: 0.5em;
      position: absolute;
      top: 0;
      right: 0;
      height: 100%;
      width: 18.4vw;
      padding: 0.5vw;
      color: white;
      font-size: 0.9vw;
      line-height: 1.4;
      overflow-y: auto;
      box-sizing: border-box;
      font-family: "Segoe UI", sans-serif;
      background: rgba(0, 0, 0, 0.25);
      backdrop-filter: blur(0.4vw);
      -webkit-backdrop-filter: blur(0.4vw);
      border-radius: 0.5vw 0 0 0.5vw;
      box-shadow: inset 0 0 0.5vw rgba(255, 255, 255, 0.1);

      scrollbar-width: thin;
      scrollbar-color: rgba(255, 255, 255, 0.3) transparent;
    }

    :host::-webkit-scrollbar { width: 0.6vw; }
    :host::-webkit-scrollbar-track { background: transparent; }
    :host::-webkit-scrollbar-thumb {
      background-color: rgba(255, 255, 255, 0.3);
      border-radius: 0.3vw;
      border: 0.1vw solid rgba(0, 0, 0, 0.1);
    }
    :host::-webkit-scrollbar-thumb:hover {
      background-color: rgba(255, 255, 255, 0.5);
    }

    .log-entry {
      background: rgb(255 255 255 / 5%);
      padding: 0.6vw;
      border-radius: 0.5vw;
    }

    .name {
      font-weight: bold;
      display: block;
      margin-bottom: 0.3vw;
    }

    .action-line {
      color: #ccc;
      margin-left: 0.5vw;
    }

    .log-card-row {
      display: flex;
      gap: 0.3vw;
      margin-top: 0.3em;
      margin-bottom: 0.6em;
    }

    .log-card-row card-element {
      width: 2.5vw;
      height: calc(2.5vw * 1.39);
      flex-shrink: 0;
    }
  `;Dt([f({type:Array})],xe.prototype,"entries",2);xe=Dt([A("action-log")],xe);var ws=Object.defineProperty,_s=Object.getOwnPropertyDescriptor,Ze=(s,e,t,r)=>{for(var i=r>1?void 0:r?_s(e,t):e,n=s.length-1,o;n>=0;n--)(o=s[n])&&(i=(r?o(e,t,i):o(i))||i);return r&&i&&ws(e,t,i),i};let he=class extends v{constructor(){super(...arguments),this.data=null,this.isReady=!1}handleReady(){g.readyNextRound()}handleQuit(){fetch(`/api/lobby/rooms/${g.roomCode}`,{method:"DELETE",credentials:"include"}).then(()=>{window.location.hash="#/"})}render(){if(!this.data)return m;const s=this.data,e=Object.keys(s.hands);return h`
      <div class="overlay">
        <div class="popup">
          ${s.game_over?h`
            <div class="game-over-banner">
              🏆 Game Over!
              ${s.winners.map(([t,r])=>h`<strong>${t}</strong> (${r})`)}
            </div>
          `:""}

          <h2>Round Summary</h2>
          <table>
            <tr><th>Player</th><th>Hand</th><th>Round Pts</th><th>Total</th></tr>
            ${e.map(t=>{const r=s.round_points[t]===0,i=t===s.ender&&s.penalty_applied,n=i?"penalized":r?"winner":"",o=s.round_points[t],a=i?`${o} (+15)`:`${o}`;return h`
                <tr class=${n}>
                  <td>${t}</td>
                  <td>
                    <div class="hand-cards">
                      ${s.hands[t].map(c=>h`<card-element mini .card=${c}></card-element>`)}
                    </div>
                  </td>
                  <td>${a}</td>
                  <td>${s.total_scores[t]}</td>
                </tr>
              `})}
          </table>

          <div class="buttons">
            <button
              class="btn-ready ${this.isReady?"active":""}"
              @click=${this.handleReady}
            >
              ${s.game_over?this.isReady?"Cancel New Game":"Ready for New Game":this.isReady?"Cancel Ready":"I'm Ready"}
            </button>
            <button class="btn-quit" @click=${this.handleQuit}>Quit</button>
          </div>
        </div>
      </div>
    `}};he.styles=T`
    :host { display: block; }

    .overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 100;
      animation: overlayFade 0.3s ease;
    }
    @keyframes overlayFade {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .popup {
      background: #1a2332;
      border-radius: 1vw;
      padding: 2vw 3vw;
      min-width: 40vw;
      max-width: 70vw;
      box-shadow: 0 0 3vw rgba(0, 0, 0, 0.5);
      color: white;
      animation: popupSlide 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    @keyframes popupSlide {
      from { transform: scale(0.8) translateY(2vw); opacity: 0; }
      to { transform: scale(1) translateY(0); opacity: 1; }
    }

    h2 {
      text-align: center;
      font-size: 1.8vw;
      margin: 0 0 1.5vw;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 1.1vw;
    }

    th, td {
      padding: 0.5vw 1vw;
      text-align: left;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    th { color: rgba(255, 255, 255, 0.6); font-weight: 600; }

    .winner td { color: #4ade80; }
    .penalized td { color: #f87171; }

    .hand-cards {
      display: flex;
      gap: 0.2vw;
      --card-width: 2.5vw;
    }
    .hand-cards card-element {
      animation: revealCard 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) backwards;
    }
    .hand-cards card-element:nth-child(1) { animation-delay: 200ms; }
    .hand-cards card-element:nth-child(2) { animation-delay: 260ms; }
    .hand-cards card-element:nth-child(3) { animation-delay: 320ms; }
    .hand-cards card-element:nth-child(4) { animation-delay: 380ms; }
    .hand-cards card-element:nth-child(5) { animation-delay: 440ms; }
    .hand-cards card-element:nth-child(6) { animation-delay: 500ms; }
    @keyframes revealCard {
      from { transform: scale(0.5) rotateY(180deg); opacity: 0; }
      to { transform: scale(1) rotateY(0deg); opacity: 1; }
    }

    .buttons {
      display: flex;
      justify-content: center;
      gap: 2vw;
      margin-top: 1.5vw;
    }

    button {
      padding: 0.6vw 2vw;
      border: none;
      border-radius: 0.4vw;
      font-size: 1.1vw;
      cursor: pointer;
      font-weight: 600;
    }

    .btn-ready {
      background: #4caf50;
      color: white;
    }
    .btn-ready:hover { background: #43a047; }
    .btn-ready.active {
      background: #f97316;
    }

    .btn-quit {
      background: #991b1b;
      color: white;
    }
    .btn-quit:hover { background: #7f1d1d; }

    .game-over-banner {
      text-align: center;
      font-size: 1.5vw;
      color: #fbbf24;
      margin-bottom: 1vw;
    }
  `;Ze([f({type:Object})],he.prototype,"data",2);Ze([f({type:Boolean})],he.prototype,"isReady",2);he=Ze([A("round-summary")],he);var $s=Object.defineProperty,ks=Object.getOwnPropertyDescriptor,pe=(s,e,t,r)=>{for(var i=r>1?void 0:r?ks(e,t):e,n=s.length-1,o;n>=0;n--)(o=s[n])&&(i=(r?o(e,t,i):o(i))||i);return r&&i&&$s(e,t,i),i};let F=class extends v{constructor(){super(...arguments),this.duration=30,this.active=!1,this.isMyTurn=!1,this.remaining=0}updated(s){(s.has("active")||s.has("isMyTurn"))&&(this.active?this.startTimer():this.stopTimer())}disconnectedCallback(){super.disconnectedCallback(),this.stopTimer()}startTimer(){this.stopTimer(),this.remaining=this.duration,this.interval=window.setInterval(()=>{if(this.remaining--,this.isMyTurn){const s=this.remaining/this.duration;s<=.2&&s>0?$.play("timer-danger"):Math.abs(s-.5)<.02&&$.play("timer-warning")}this.remaining<=0&&(this.remaining=0,this.stopTimer(),this.dispatchEvent(new CustomEvent("timeout")))},1e3)}stopTimer(){this.interval&&(clearInterval(this.interval),this.interval=void 0)}render(){if(!this.active||this.duration<=0)return m;const s=this.remaining/this.duration,e=2*Math.PI*18,t=e*(1-s),r=s>.5?"plenty":s>.2?"warning":"danger";return h`
      <div class="timer-ring">
        <svg viewBox="0 0 40 40">
          <circle class="track" cx="20" cy="20" r="18" />
          <circle
            class="progress ${r}"
            cx="20" cy="20" r="18"
            stroke-dasharray=${e}
            stroke-dashoffset=${t}
          />
        </svg>
        <span class="time-text ${r}">${this.remaining}</span>
      </div>
    `}};F.styles=T`
    :host { display: block; }

    .timer-ring {
      position: relative;
      width: 4vw;
      height: 4vw;
    }

    svg {
      transform: rotate(-90deg);
      width: 100%;
      height: 100%;
    }

    .track {
      fill: none;
      stroke: rgba(255, 255, 255, 0.1);
      stroke-width: 3;
    }

    .progress {
      fill: none;
      stroke-width: 3;
      stroke-linecap: round;
      transition: stroke-dashoffset 1s linear, stroke 0.3s;
    }

    .progress.plenty { stroke: #4ade80; }
    .progress.warning { stroke: #fbbf24; }
    .progress.danger { stroke: #ef4444; }

    .time-text {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 1vw;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
    }

    .time-text.danger { color: #ef4444; }
    .time-text.warning { color: #fbbf24; }
    .time-text.plenty { color: rgba(255, 255, 255, 0.7); }
  `;pe([f({type:Number})],F.prototype,"duration",2);pe([f({type:Boolean})],F.prototype,"active",2);pe([f({type:Boolean})],F.prototype,"isMyTurn",2);pe([w()],F.prototype,"remaining",2);F=pe([A("turn-timer")],F);var xs=Object.defineProperty,Ts=Object.getOwnPropertyDescriptor,Oe=(s,e,t,r)=>{for(var i=r>1?void 0:r?Ts(e,t):e,n=s.length-1,o;n>=0;n--)(o=s[n])&&(i=(r?o(e,t,i):o(i))||i);return r&&i&&xs(e,t,i),i};const As=["left","right","top"];let X=class extends v{constructor(){super(...arguments),this._tick=0,this.errorMsg="",this.botThinking=!1,this.prevIsMyTurn=!1,this.prevRoundEnded=!1}connectedCallback(){super.connectedCallback(),this.unsubscribe=g.subscribe(()=>{this._tick++,this.playStateChangeSounds(),this.checkBotTurn()}),this.startPolling()}async startPolling(){if(!g.roomCode){this.pollTimer=window.setTimeout(()=>this.startPolling(),500);return}try{const s=await fetch(`/api/lobby/rooms/${g.roomCode}/game-state`,{credentials:"include"});if(s.ok){const e=await s.json();g.updateFromServer(e)}}catch{}this.pollTimer=window.setTimeout(()=>this.startPolling(),1e3)}playStateChangeSounds(){const s=g;s.isMyTurn&&!this.prevIsMyTurn&&$.play("your-turn"),s.roundEnded&&!this.prevRoundEnded&&$.play(s.gameOver?"game-over":"round-end"),this.prevIsMyTurn=s.isMyTurn,this.prevRoundEnded=s.roundEnded}disconnectedCallback(){var s;super.disconnectedCallback(),(s=this.unsubscribe)==null||s.call(this),this.errorTimer&&clearTimeout(this.errorTimer),this.botTimer&&clearTimeout(this.botTimer),this.pollTimer&&clearTimeout(this.pollTimer)}showError(s){var t;this.errorMsg=s,$.play("error"),this.errorTimer&&clearTimeout(this.errorTimer),this.errorTimer=window.setTimeout(()=>{this.errorMsg=""},3e3);const e=(t=this.shadowRoot)==null?void 0:t.querySelector("#play-selected");e&&as(e)}checkBotTurn(){const s=g;!s.isMyTurn&&!s.roundEnded&&s.currentPlayer.startsWith("Bot-")?this.botTimer||(this.botThinking=!0,this.botTimer=window.setTimeout(()=>{this.botTimer=void 0,this.triggerBotAction()},1200)):(this.botTimer&&(clearTimeout(this.botTimer),this.botTimer=void 0),this.botThinking=!1)}async triggerBotAction(){try{if((await fetch(`/api/dev/bot-action/${g.roomCode}`,{method:"POST",credentials:"include"})).ok){const e=await fetch(`/api/lobby/rooms/${g.roomCode}/game-state`,{credentials:"include"});if(e.ok){const t=await e.json();g.updateFromServer(t)}}}catch{}this.botThinking=!1}async handlePlay(){if(!g.drawSource){this.showError("Choose draw source (click deck or pile)");return}if(g.selectedOrder.length===0){this.showError("Select cards to play");return}$.play("card-play");const s=await g.playCards();s&&this.showError(s)}async handleEndRound(){const s=await g.endRound();s&&this.showError(s)}handleTimeout(){g.isMyTurn&&(g.selectedOrder.length===0&&g.hand.length>0&&g.toggleCardSelection(0),g.drawSource||g.setDrawSource("deck"),g.playCards())}handleQuit(){confirm("End the game for everyone?")&&fetch(`/api/lobby/rooms/${g.roomCode}`,{method:"DELETE",credentials:"include"}).then(()=>{window.location.hash="#/"})}toggleSound(){$.muted=!$.muted,this.requestUpdate()}toggleFullscreen(){var s,e,t;document.fullscreenElement?(t=document.exitFullscreen)==null||t.call(document):(e=(s=document.documentElement).requestFullscreen)==null||e.call(s)}render(){var i,n;const s=g,e=s.isMyTurn,t=s.actionLog.length>0?((n=(i=s.actionLog[s.actionLog.length-1])==null?void 0:i.items.find(o=>o.type==="played"))==null?void 0:n.cards)??[]:[],r=s.opponents;return h`
      <div class="game-wrapper">
        <div class="game-container">
          <div class="game-table">
            ${r.map((o,a)=>a<3?h`
                    <opponent-hand
                      position=${As[a]}
                      .name=${o.name}
                      .cardCount=${o.cardCount}
                      .score=${o.score}
                      .isCurrentTurn=${o.name===s.currentPlayer}
                    ></opponent-hand>
                  `:m)}

            <!-- Deck and pile positioned inside the table -->
            <deck-pile
              .pileTop=${s.pileTop}
              .deckCount=${s.deckCount}
              .drawSource=${s.drawSource}
              .lastPlayed=${t}
              .interactive=${e}
            ></deck-pile>

            <!-- Player hand at bottom of table -->
            <div class="player-area">
              <card-hand
                .cards=${s.hand}
                .selectedOrder=${s.selectedOrder}
                .interactive=${e}
                .handValue=${s.handValue}
                .playerName=${s.playerName}
                .score=${s.scores[s.playerName]??0}
                .isCurrentTurn=${s.playerName===s.currentPlayer}
              ></card-hand>
            </div>

            ${this.botThinking?h`
              <div class="bot-thinking">${s.currentPlayer} is thinking...</div>
            `:m}

            ${s.turnTimer>0?h`
              <turn-timer
                .duration=${s.turnTimer}
                .active=${!s.roundEnded}
                .isMyTurn=${e}
                @timeout=${this.handleTimeout}
              ></turn-timer>
            `:m}
          </div>

          <!-- Log panel to the right of the table -->
          <action-log .entries=${s.actionLog}></action-log>

          <!-- Buttons -->
          <button id="play-selected" ?disabled=${!e||s.roundEnded} @click=${this.handlePlay}>
            Play
          </button>
          <button id="end-round" ?disabled=${!s.canEndRound} @click=${this.handleEndRound}>
            Finish
          </button>
          <button id="end-game" @click=${this.handleQuit}>Quit</button>
          <button id="fullscreen-btn" @click=${this.toggleFullscreen}>⛶</button>
          <button class="sound-btn" @click=${this.toggleSound}>
            ${$.muted?"🔇":"🔊"}
          </button>
        </div>
      </div>

      ${s.roundData?h`
            <round-summary
              .data=${s.roundData}
              .isReady=${s.readyPlayers.includes(s.playerName)}
            ></round-summary>
          `:m}

      ${this.errorMsg?h`<div class="error-toast">${this.errorMsg}</div>`:m}
    `}};X.styles=T`
    :host {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      width: 100vw;
      overflow: hidden;
      background: radial-gradient(circle, #065c2f 60%, #003d1f 100%);
      background-color: #003d1f;
    }

    /* === Game wrapper — maintains aspect ratio like original === */
    .game-wrapper {
      width: 100vw;
      height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      aspect-ratio: 20 / 9;
      max-width: calc(100vh * (20 / 9));
      max-height: calc(100vw / (20 / 9));
      overflow: hidden;
    }

    .game-container {
      width: 100%;
      height: 100%;
      display: flex;
      position: relative;
      align-items: center;
      justify-content: center;
    }

    /* === Table — exact original styling === */
    .game-table {
      aspect-ratio: 2 / 1;
      margin: 0 auto;
      width: 77vw;
      background: radial-gradient(ellipse at center, #155d25 60%, #0f3c17 100%);
      border: 0.8vw solid #3b1e0d;
      border-radius: 20vw;
      box-shadow: inset 0 0 4vw rgb(0 0 0 / 60%);
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      margin-right: 19.5vw;
    }

    /* === Player area at bottom of table === */
    .player-area {
      position: absolute;
      bottom: 2%;
      left: 50%;
      transform: translateX(-50%);
    }

    /* === Base Button Styling (matches original) === */
    button {
      padding: 0.6vw 1.2vw;
      font-size: 1vw;
      cursor: pointer;
      background: #333;
      color: white;
      border: 0.1vw solid #666;
      border-radius: 0.4vw;
      transition: background 0.2s;
    }
    button:hover { filter: brightness(1.1); }
    button:disabled { opacity: 0.5; cursor: not-allowed; }

    /* === Main game buttons — matching original sizes and positions === */
    #play-selected,
    #end-round,
    #end-game,
    #fullscreen-btn {
      position: absolute;
      z-index: 10;
      font-size: 2.5vw !important;
      padding: 1vw 2vw !important;
      border-radius: 0.4vw;
      color: white;
      cursor: pointer;
    }

    #play-selected {
      bottom: 2%;
      left: 2%;
      background-color: #4caf50;
      border: 0.1vw solid #2e7d32;
    }

    #end-round {
      bottom: 2%;
      right: 22%;
      background-color: #333;
      border: 0.1vw solid #666;
    }

    #end-game {
      top: 2%;
      right: 22%;
      background-color: rgb(150 22 22);
      border: 0.1vw solid #700;
    }

    #fullscreen-btn {
      top: 2%;
      left: 2%;
      background-color: #444;
      border: 0.1vw solid #888;
    }

    /* === Error toast — positioned over everything === */
    .error-toast {
      position: fixed;
      top: 2vw;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(239, 68, 68, 0.95);
      color: white;
      padding: 1vw 3vw;
      border-radius: 0.5vw;
      font-size: 1.8vw;
      font-weight: bold;
      z-index: 9999;
      backdrop-filter: blur(4px);
      box-shadow: 0 0.3vw 1vw rgba(0, 0, 0, 0.5);
      animation: slideDown 0.3s ease;
      white-space: nowrap;
    }
    @keyframes slideDown {
      from { transform: translateX(-50%) translateY(-100%); opacity: 0; }
      to { transform: translateX(-50%) translateY(0); opacity: 1; }
    }

    /* === Bot thinking indicator === */
    .bot-thinking {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 1.2vw;
      color: rgba(255, 255, 255, 0.5);
      z-index: 5;
      animation: pulse 1s ease-in-out infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 0.4; }
      50% { opacity: 0.8; }
    }

    /* === Turn timer positioned top-center of table === */
    turn-timer {
      position: absolute;
      top: 8%;
      left: 50%;
      transform: translateX(-50%);
      z-index: 5;
    }

    /* === Sound toggle button === */
    .sound-btn {
      position: absolute;
      top: 2%;
      left: calc(2% + 5vw);
      z-index: 10;
      font-size: 2vw !important;
      padding: 0.8vw 1.2vw !important;
      background-color: #444;
      border: 0.1vw solid #888;
    }
  `;Oe([w()],X.prototype,"_tick",2);Oe([w()],X.prototype,"errorMsg",2);Oe([w()],X.prototype,"botThinking",2);X=Oe([A("game-page")],X);var Es=Object.defineProperty,Cs=Object.getOwnPropertyDescriptor,jt=(s,e,t,r)=>{for(var i=r>1?void 0:r?Cs(e,t):e,n=s.length-1,o;n>=0;n--)(o=s[n])&&(i=(r?o(e,t,i):o(i))||i);return r&&i&&Es(e,t,i),i};let Te=class extends v{constructor(){super(...arguments),this.route={page:"lobby"}}connectedCallback(){super.connectedCallback(),window.addEventListener("hashchange",()=>this.resolveRoute()),this.resolveRoute()}resolveRoute(){const s=window.location.hash.slice(1)||"/",e=s.match(/^\/join\/(.+)$/);if(e){this.route={page:"join",code:e[1]};return}const t=s.match(/^\/game\/(.+)$/);if(t){const r=t[1];this.route={page:"game",code:r},g.connect(r,"");return}this.route={page:"lobby"}}render(){switch(this.route.page){case"join":return h`<join-page .roomCode=${this.route.code}></join-page>`;case"game":return h`<game-page></game-page>`;default:return h`<lobby-page></lobby-page>`}}};Te.styles=T`
    :host { display: block; width: 100%; height: 100%; }
  `;jt([w()],Te.prototype,"route",2);Te=jt([A("app-shell")],Te);
//# sourceMappingURL=index-Bpykrjqr.js.map
