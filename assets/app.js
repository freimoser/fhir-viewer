var Me={"&lt;":"<","&gt;":">","&amp;":"&","&quot;":'"',"&apos;":"'"};function le(e){return e.replace(/&(#x[0-9a-fA-F]+|#\d+|lt|gt|amp|quot|apos);/g,(r,t)=>{if(t[0]==="#"){let i=t[1]==="x"?parseInt(t.slice(2),16):parseInt(t.slice(1),10);try{return String.fromCodePoint(i)}catch{return r}}return Me[r]??r})}function je(e,r){let t=1,i=1;for(let l=0;l<r&&l<e.length;l++)e[l]===`
`?(t++,i=1):i++;return{line:t,column:i}}var j=class extends Error{constructor(r,t){super(r),this.pos=t}};function $e(e){let r=0,t=e.length,i={name:null,attrs:{},children:[],text:""},l=[i];if(/<!DOCTYPE|<!ENTITY/i.test(e))throw new j("DOCTYPE/ENTITY-Deklarationen werden aus Sicherheitsgr\xFCnden nicht gelesen.",e.search(/<!DOCTYPE|<!ENTITY/i));for(;r<t;){let n=e.indexOf("<",r);if(n<0){if(e.slice(r).trim())throw new j("Text au\xDFerhalb eines Elements.",r);break}if(n>r){let x=e.slice(r,n);l[l.length-1].text+=le(x)}if(e.startsWith("<!--",n)){let x=e.indexOf("-->",n+4);if(x<0)throw new j("Kommentar nicht geschlossen.",n);r=x+3;continue}if(e.startsWith("<![CDATA[",n)){let x=e.indexOf("]]>",n);if(x<0)throw new j("CDATA nicht geschlossen.",n);l[l.length-1].text+=e.slice(n+9,x),r=x+3;continue}if(e.startsWith("<?",n)){let x=e.indexOf("?>",n);if(x<0)throw new j("Verarbeitungsanweisung nicht geschlossen.",n);r=x+2;continue}if(e.startsWith("</",n)){let x=e.indexOf(">",n);if(x<0)throw new j("Schlie\xDFendes Tag ohne >.",n);let $=e.slice(n+2,x).trim(),N=l[l.length-1];if(l.length===1||N.name!==$)throw new j(`Schlie\xDFendes Tag </${$}> passt nicht zu ${l.length>1?"<"+N.name+">":"keinem offenen Element"}.`,n);l.pop(),r=x+1;continue}let o=n+1,f=/^[A-Za-z_][\w:.-]*/.exec(e.slice(o,o+200));if(!f)throw new j("Ung\xFCltiger Elementname nach <.",n);let c=f[0];o+=c.length;let v={};for(;;){for(;o<t&&/\s/.test(e[o]);)o++;if(o>=t)throw new j(`Start-Tag <${c}> nicht geschlossen.`,n);if(e[o]===">"||e.startsWith("/>",o))break;let x=/^([A-Za-z_][\w:.-]*)\s*=\s*("([^"]*)"|'([^']*)')/.exec(e.slice(o,o+1e5));if(!x)throw new j(`Ung\xFCltiges Attribut in <${c}>.`,o);v[x[1]]=le(x[3]??x[4]),o+=x[0].length}let T={name:c,attrs:v,children:[],text:"",pos:n};l[l.length-1].children.push(T),e.startsWith("/>",o)?r=o+2:(l.push(T),r=o+1)}if(l.length>1)throw new j(`Element <${l[l.length-1].name}> wurde nicht geschlossen.`,e.length);if(i.children.length!==1)throw new j(i.children.length?"Mehrere Wurzelelemente.":"Kein Element gefunden.",0);return i.children[0]}var Ie=new Set(["contained","resource","outcome"]);function F(e){return e.includes(":")?e.split(":").pop():e}function Q(e,r,t=""){let i={};r&&(i.resourceType=F(e.name));for(let[n,o]of Object.entries(e.attrs))n==="xmlns"||n.startsWith("xmlns:")||n==="value"||(i[n]=o);let l=new Map;for(let n of e.children){let o=F(n.name);l.has(o)||l.set(o,[]),l.get(o).push(n)}for(let[n,o]of l){let f=o.map(c=>n==="div"?Ne(c):Ie.has(n)&&c.children.length===1&&/^[A-Z]/.test(F(c.children[0].name))&&!("value"in c.attrs)?Q(c.children[0],!0):"value"in c.attrs&&c.children.length===0&&Object.keys(c.attrs).every(v=>v==="value"||v==="xmlns")||"value"in c.attrs?ce(n,c.attrs.value,F(e.name)):Q(c,!1,F(e.name)));f.length===1?i[n]=f[0]:i[n]=f}return i}function Ne(e){let r="";return(function t(i){r+=i.text;for(let l of i.children)t(l)})(e),r.replace(/\s+/g," ").trim()}var ze=/(Quantity|^(low|high|numerator|denominator|quantity|count|age|duration|distance|simpleQuantity))$/i;function ce(e,r,t=""){return r==="true"||r==="false"?r==="true":/^-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?$/.test(r)&&(e==="value"&&ze.test(t)||/(Integer|Decimal|PositiveInt|UnsignedInt)$/.test(e)||e==="total")?Number(r):r}function ue(e){try{let r=$e(e);return{ok:!0,resource:Q(r,!0)}}catch(r){if(r instanceof j){let t=je(e,r.pos??0);return{ok:!1,error:{message:`Ung\xFCltiges XML (Zeile ${t.line}, Spalte ${t.column}): ${r.message}`,hint:'Pr\xFCfen Sie, ob alle Elemente geschlossen sind und die Datei vollst\xE4ndig kopiert wurde. FHIR-XML beginnt mit dem Ressourcennamen als Wurzelelement, zum Beispiel <Patient xmlns="http://hl7.org/fhir">.',line:t.line,column:t.column}}}throw r}}function de(e,r){let t=1,i=1;for(let l=0;l<r&&l<e.length;l++)e[l]===`
`?(t++,i=1):i++;return{line:t,column:i}}function Ue(e,r){let t=String(e&&e.message||""),i=t.match(/line (\d+) column (\d+)/i);return i?{line:+i[1],column:+i[2]}:(i=t.match(/position (\d+)/i),i?{...de(r,+i[1]),offset:+i[1]}:/end of (JSON|data)|Unterminated|Unexpected end/i.test(t)?de(r,r.length):null)}function Le(e,r,t){let i=String(e);if(t&&t.offset!==void 0&&t.offset>=r.trimEnd().length)return"Die Eingabe endet mitten im JSON. Meist fehlt eine schlie\xDFende Klammer } oder ] oder ein Anf\xFChrungszeichen. Wurde beim Kopieren etwas abgeschnitten?";let l=t&&r.split(`
`)[t.line-1]||"";return/Unexpected end|end of JSON|end of data/i.test(i)?"Die Eingabe endet mitten im JSON. Meist fehlt eine schlie\xDFende Klammer } oder ] oder ein Anf\xFChrungszeichen. Wurde beim Kopieren etwas abgeschnitten?":/Expected double-quoted property name|Unexpected token '?\}/i.test(i)||/,\s*[}\]]/.test(l)?"Wahrscheinlich steht ein Komma zu viel nach dem letzten Eintrag. JSON erlaubt kein Komma vor } oder ].":/Expected ',' or|after property value|after array element/i.test(i)?"Zwischen zwei Eintr\xE4gen fehlt ein Komma, oder ein Anf\xFChrungszeichen wurde nicht geschlossen.":/^\s*[{\[]/.test(r)?/Unexpected token '?'/i.test(i)||/'/.test(l)?`JSON erlaubt nur doppelte Anf\xFChrungszeichen ("). Einfache Anf\xFChrungszeichen (') sind ung\xFCltig.`:/Unexpected token/i.test(i)&&/^\s*</.test(r)?'Das sieht nach XML oder HTML aus. XML-Ressourcen beginnen mit einem Element wie <Patient xmlns="http://hl7.org/fhir">.':/Unexpected token|Unexpected character|not valid JSON/i.test(i)?"An dieser Stelle steht ein Zeichen, das in JSON nicht erlaubt ist, etwa ein Kommentar, ein unquotierter Name oder ein Sonderzeichen vom Kopieren.":"Die Eingabe ist kein g\xFCltiges JSON. Pr\xFCfen Sie Klammern, Kommas und Anf\xFChrungszeichen an der angegebenen Stelle.":"Die Eingabe beginnt weder mit { (JSON) noch mit < (XML). F\xFCgen Sie den Inhalt einer FHIR-Datei ein, nicht den Dateinamen oder einen Hinweistext."}function pe(e){let r=String(e??"");r.charCodeAt(0)===65279&&(r=r.slice(1));let t=r.trim();if(!t)return{ok:!1,error:{message:"Keine Eingabe.",hint:"F\xFCgen Sie JSON oder XML einer FHIR-Ressource ein, w\xE4hlen Sie eine Datei oder laden Sie ein Beispiel."}};if(t[0]==="<"){let l=ue(r);if(!l.ok)return{ok:!1,format:"xml",error:l.error};let n=(r.replace(/<\?[\s\S]*?\?>|<!--[\s\S]*?-->/g,"").match(/<[A-Za-z][^>]*>/)||[""])[0],o=/xmlns\s*=\s*["']http:\/\/hl7\.org\/fhir["']/.test(n)?[]:[{level:"warn",where:"XML",msg:'Dem Wurzelelement fehlt der Namensraum xmlns="http://hl7.org/fhir". Ohne ihn ist die Datei kein g\xFCltiges FHIR-XML, auch wenn sie hier angezeigt wird.'}];return{ok:!0,format:"xml",resource:l.resource,notes:o}}let i;try{i=JSON.parse(r)}catch(l){let n=Ue(l,r);return{ok:!1,format:"json",error:{message:"Ung\xFCltiges JSON"+(n?` (Zeile ${n.line}, Spalte ${n.column})`:"")+": "+String(l.message).replace(/^JSON\.parse: /,""),hint:Le(l.message,r,n),line:n?.line,column:n?.column}}}return Array.isArray(i)?{ok:!1,format:"json",error:{message:"Auf oberster Ebene steht ein Array.",hint:'FHIR erwartet ein einzelnes Objekt mit "resourceType". Mehrere Ressourcen werden in einem Bundle zusammengefasst ("resourceType": "Bundle").'}}:i===null||typeof i!="object"?{ok:!1,format:"json",error:{message:"Das JSON ist kein Objekt.",hint:"Eine FHIR-Ressource ist ein JSON-Objekt, das mit { beginnt."}}:{ok:!0,format:"json",resource:i}}var U=e=>e!==null&&typeof e=="object"&&!Array.isArray(e);function J(e){return e?/loinc\.org/.test(e)?"LOINC":/snomed\.info/.test(e)?"SNOMED CT":/unitsofmeasure\.org/.test(e)?"UCUM":/rxnav\.nlm\.nih\.gov/.test(e)?"RxNorm":/terminology\.hl7\.org\/CodeSystem\//.test(e)?e.split("/").pop():String(e).replace(/\/+$/,"").split(/[\/#:]/).pop()||e:""}function Y(e){if(e==null)return"null";if(Array.isArray(e))return"array";if(typeof e!="object")return"primitive";let r=Object.keys(e),t=i=>r.includes(i);return t("reference")&&typeof e.reference=="string"?"Reference":t("coding")&&Array.isArray(e.coding)||typeof e.text=="string"&&r.every(i=>["text","id","extension"].includes(i))?"CodeableConcept":(t("system")||t("code")||t("display"))&&!t("value")&&!t("unit")?"Coding":t("value")&&typeof e.value=="number"&&(t("unit")||t("code")||t("system")||r.length===1)?"Quantity":t("value")&&t("system")&&["phone","fax","email","pager","url","sms","other"].includes(e.system)?"ContactPoint":t("value")&&(t("system")||t("use")||t("type")||r.length<=2)&&typeof e.value=="string"?"Identifier":r.length&&r.every(i=>["start","end","id","extension"].includes(i))&&(t("start")||t("end"))?"Period":t("family")||t("given")?"HumanName":t("line")||t("city")||t("postalCode")||t("country")?"Address":t("low")||t("high")?"Range":t("numerator")||t("denominator")?"Ratio":t("text")&&(t("time")||t("authorString")||t("authorReference"))?"Annotation":t("contentType")||t("url")&&t("title")?"Attachment":"object"}function fe(e){let r=e.display||e.code||"",t=J(e.system);return{head:r,code:[t,e.code].filter(Boolean).join(" ")}}function ee(e){let r=Array.isArray(e.coding)?e.coding:[],t=r[0]?fe(r[0]):{head:"",code:""},i=e.text||t.head||"",l=r.map(n=>[J(n.system),n.code].filter(Boolean).join(" ")).filter(Boolean);return{head:i,codes:l}}function W(e){if(e.text)return e.text;let r=Array.isArray(e.given)?e.given.join(" "):e.given||"",t=Array.isArray(e.prefix)?e.prefix.join(" "):"",i=Array.isArray(e.suffix)?e.suffix.join(" "):"";return[t,r,e.family,i].filter(Boolean).join(" ")}function D(e){switch(Y(e)){case"primitive":return String(e);case"CodeableConcept":{let r=ee(e);return r.head||r.codes[0]||""}case"Coding":{let r=fe(e);return r.head||r.code}case"Quantity":return`${e.comparator||""}${e.value}${e.unit||e.code?" "+(e.unit||e.code):""}`;case"Period":return`${e.start||"?"} \u2013 ${e.end||"offen"}`;case"HumanName":return W(e);case"Address":return[Array.isArray(e.line)?e.line.join(", "):e.line,[e.postalCode,e.city].filter(Boolean).join(" "),e.country].filter(Boolean).join(", ")||e.text||"";case"ContactPoint":return`${e.system}: ${e.value}${e.use?" ("+e.use+")":""}`;case"Identifier":return`${e.value}${e.system?" ("+J(e.system)+")":""}`;case"Range":return`${e.low?D(e.low):"?"} \u2013 ${e.high?D(e.high):"?"}`;case"Ratio":return`${e.numerator?D(e.numerator):"?"} / ${e.denominator?D(e.denominator):"?"}`;case"Annotation":return e.text;case"Attachment":return[e.title,e.contentType].filter(Boolean).join(" \xB7 ")||"Anhang";case"Reference":return e.display||e.reference;case"array":return e.map(D).join("; ");case"null":return"";default:return JSON.stringify(e)}}function G(e,r){if(!U(e))return null;for(let t of Object.keys(e))if(t.length>r.length&&t.startsWith(r)&&/[A-Z]/.test(t[r.length]))return{key:t,value:e[t]};return e[r]!==void 0?{key:r,value:e[r]}:null}var me=new Set(["resourceType","id","meta","text","contained","extension","modifierExtension","implicitRules","language"]);function he(e){if(!U(e))return"";let r=e.resourceType,t=(...l)=>{for(let n of l){let o=G(e,n);if(o&&o.value!==void 0&&o.value!==null)return o.value}};if(r==="Patient"||r==="Practitioner"||r==="RelatedPerson"||r==="Person"){let l=Array.isArray(e.name)?e.name[0]:e.name,n=[l?W(l):"",e.birthDate?"* "+e.birthDate:"",e.gender||""].filter(Boolean);if(n.length)return n.join(" \xB7 ");let o=Array.isArray(e.identifier)?e.identifier[0]:e.identifier;return o?"ID "+D(o):r+(e.id?" "+e.id:"")+" (ohne Namen)"}if(r==="Observation"){let l=e.code?D(e.code):"",n=G(e,"value"),o="";return n&&n.value!==void 0?o=D(n.value):Array.isArray(e.component)&&e.component.length&&(o=e.component.map(f=>{let c=G(f,"value");return c?D(c.value):""}).filter(Boolean).join(" / ")),[l,o].filter(Boolean).join(": ")||"(ohne Code)"}if(r==="Encounter")return[e.class?D(e.class):"",e.status].filter(Boolean).join(" \xB7 ")||"Encounter";if(r==="Condition")return[e.code?D(e.code):"",e.clinicalStatus?D(e.clinicalStatus):""].filter(Boolean).join(" \xB7 ")||"Condition";if(r==="MedicationRequest"||r==="MedicationStatement"||r==="MedicationAdministration"){let l=t("medication");return[l?D(l.concept||l):"",e.status].filter(Boolean).join(" \xB7 ")||r}if(r==="Organization"||r==="Location"||r==="Device")return e.name||(Array.isArray(e.identifier)&&e.identifier[0]?D(e.identifier[0]):"")||r;let i=e.code||e.type||e.vaccineCode||e.medicationCodeableConcept||e.title||e.name;return i?D(i):e.status?String(e.status):""}var Fe=/^(.*?)([A-Z][A-Za-z]+)\/([A-Za-z0-9\-.]{1,64})(\/_history\/([A-Za-z0-9\-.]{1,64}))?$/,ge=/^[A-Za-z][A-Za-z0-9+.-]*:/;function Z(e){let r=Fe.exec(e||"");return r?{root:r[1],type:r[2],id:r[3],version:r[5]||null}:null}function ye(e){let r=new Map,t=new Map;for(let i of e){if(i.fullUrl){let l=Z(i.fullUrl)?.version?i.fullUrl.replace(/\/_history\/[^/]+$/,""):i.fullUrl;r.has(l)||r.set(l,[]),r.get(l).push(i)}if(i.resource&&i.resource.resourceType&&i.resource.id){let l=i.resource.resourceType+"/"+i.resource.id;t.has(l)||t.set(l,[]),t.get(l).push(i)}}return{byUrl:r,byTypeId:t,entries:e}}function qe(e,r){return r?e.filter(i=>i.resource?.meta?.versionId===r):e}function be(e,r){let{entry:t,index:i,resource:l}=r;if(typeof e=="string"&&e[0]==="#"){if(e==="#")return{status:"contained",index:t?t.index:0,method:"contained"};let c=e.slice(1);return Array.isArray(l?.contained)&&l.contained.some(T=>T&&T.id===c)?{status:"contained",index:t?t.index:0,method:"contained",containedId:c}:{status:"unresolved",reason:`contained-Ressource mit id "${c}" fehlt`}}if(!i)return{status:"external"};let n=(c,v,T)=>{let x=c;if(T){if(x=qe(c,T),!x.length)return{status:"unresolved",reason:`Version ${T} nicht im Bundle`};v="versionId"}return x.length===1?{status:"resolved",index:x[0].index,method:v}:x.length>1?{status:"ambiguous",indexes:x.map($=>$.index),method:v}:null},o=Z(e),f=null;if(ge.test(e))f=e;else if(o&&!o.root){let c=t&&Z(t.fullUrl);c&&(f=c.root+e)}if(f){let c=f.replace(/\/_history\/[^/]+$/,""),v=Z(f)?.version||null,T=i.byUrl.get(c);if(T){let x=n(T,"fullUrl",v);if(x)return x}}if(o){let c=i.byTypeId.get(o.type+"/"+o.id);if(c){let v=n(c,"typ-id",o.version);if(v&&v.status==="resolved")return v}}return ge.test(e)&&/^https?:/i.test(e)?{status:"unresolved",external:!0,reason:"nicht im Bundle (externe URL)"}:{status:"unresolved",reason:"nicht im Bundle"}}function ve(e,r){if(!r||!e||!e.value)return{status:"unresolved",reason:"Identifier ohne Wert"};let t=r.entries.filter(i=>Array.isArray(i.resource?.identifier)&&i.resource.identifier.some(l=>l.value===e.value&&(l.system||"")===(e.system||"")));return t.length===1?{status:"resolved",index:t[0].index,method:"identifier"}:t.length>1?{status:"ambiguous",indexes:t.map(i=>i.index),method:"identifier"}:{status:"unresolved",reason:"kein Eintrag mit diesem Identifier"}}var Ge=new Set(["subject","patient","encounter","performer","author","requester","recorder","asserter","basedOn","partOf","managingOrganization","serviceProvider","generalPractitioner","result","specimen","device","location","individual","medicationReference","reasonReference","focus","target","source","sender","recipient","owner","informationSource","participant","resultsInterpreter","custodian","supportingInfo","insurer","provider","payor","link","other","evidence","detail","entered","enterer","agent","who","onBehalfOf","context","hasMember","derivedFrom","prescription","request","episodeOfCare","diagnosis","condition","orderer","manufacturer","operator","member","entity","referrer"]);function we(e){let r=[];return(function t(i,l,n){if(Array.isArray(i)){i.forEach((o,f)=>t(o,l+"["+f+"]",n));return}if(!(!i||typeof i!="object")){typeof i.reference=="string"?r.push({path:l,ref:i.reference,node:i}):i.identifier&&typeof i.identifier=="object"&&!Array.isArray(i.identifier)&&n&&Ge.has(n)&&!i.value&&r.push({path:l,identifier:i.identifier,node:i});for(let[o,f]of Object.entries(i))o==="contained"&&l===""||o==="text"&&f&&typeof f=="object"||t(f,l?l+"."+o:o,o)}})(e,"",""),r}var xe=new Set(["Account","ActivityDefinition","AdverseEvent","AllergyIntolerance","Appointment","AppointmentResponse","AuditEvent","Basic","Binary","BiologicallyDerivedProduct","BodyStructure","Bundle","CapabilityStatement","CarePlan","CareTeam","CatalogEntry","ChargeItem","ChargeItemDefinition","Claim","ClaimResponse","ClinicalImpression","CodeSystem","Communication","CommunicationRequest","CompartmentDefinition","Composition","ConceptMap","Condition","Consent","Contract","Coverage","CoverageEligibilityRequest","CoverageEligibilityResponse","DetectedIssue","Device","DeviceDefinition","DeviceMetric","DeviceRequest","DeviceUseStatement","DiagnosticReport","DocumentManifest","DocumentReference","EffectEvidenceSynthesis","Encounter","Endpoint","EnrollmentRequest","EnrollmentResponse","EpisodeOfCare","EventDefinition","Evidence","EvidenceVariable","ExampleScenario","ExplanationOfBenefit","FamilyMemberHistory","Flag","Goal","GraphDefinition","Group","GuidanceResponse","HealthcareService","ImagingStudy","Immunization","ImmunizationEvaluation","ImmunizationRecommendation","ImplementationGuide","InsurancePlan","Invoice","Library","Linkage","List","Location","Measure","MeasureReport","Media","Medication","MedicationAdministration","MedicationDispense","MedicationKnowledge","MedicationRequest","MedicationStatement","MedicinalProduct","MedicinalProductAuthorization","MedicinalProductContraindication","MedicinalProductIndication","MedicinalProductIngredient","MedicinalProductInteraction","MedicinalProductManufactured","MedicinalProductPackaged","MedicinalProductPharmaceutical","MedicinalProductUndesirableEffect","MessageDefinition","MessageHeader","MolecularSequence","NamingSystem","NutritionOrder","Observation","ObservationDefinition","OperationDefinition","OperationOutcome","Organization","OrganizationAffiliation","Parameters","Patient","PaymentNotice","PaymentReconciliation","Person","PlanDefinition","Practitioner","PractitionerRole","Procedure","Provenance","Questionnaire","QuestionnaireResponse","RelatedPerson","RequestGroup","ResearchDefinition","ResearchElementDefinition","ResearchStudy","ResearchSubject","RiskAssessment","RiskEvidenceSynthesis","Schedule","SearchParameter","ServiceRequest","Slot","Specimen","SpecimenDefinition","StructureDefinition","StructureMap","Subscription","Substance","SubstanceNucleicAcid","SubstancePolymer","SubstanceProtein","SubstanceReferenceInformation","SubstanceSourceMaterial","SubstanceSpecification","SupplyDelivery","SupplyRequest","Task","TerminologyCapabilities","TestReport","TestScript","ValueSet","VerificationResult","VisionPrescription"]);var ne=["document","message","transaction","transaction-response","batch","batch-response","history","searchset","collection"];function Ee(e){let r=e.resourceType==="Bundle",t=[];r?(Array.isArray(e.entry)?e.entry:[]).forEach((n,o)=>{let f=U(n)&&U(n.resource)?n.resource:null;t.push({index:o,fullUrl:U(n)&&typeof n.fullUrl=="string"?n.fullUrl:null,resource:f,raw:n,resourceType:f&&f.resourceType||null,id:f&&f.id||null})}):t.push({index:0,fullUrl:null,resource:e,raw:null,resourceType:e.resourceType||null,id:e.id||null});let i=r?ye(t):null,l=new Map;for(let n of t){let o=n.resourceType||(n.raw&&n.raw.request?"(nur request)":n.raw&&n.raw.response?"(nur response)":"(ohne resource)");l.set(o,(l.get(o)||0)+1),n.typeKey=o,n.label=n.resource?he(n.resource)||(n.resourceType||"?")+(n.id?"/"+n.id:""):n.raw&&n.raw.request?`${n.raw.request.method||""} ${n.raw.request.url||""}`.trim():n.raw&&n.raw.response?String(n.raw.response.status||""):""}for(let n of t)if(n.refs=[],!!n.resource)for(let o of we(n.resource)){let f=o.identifier?ve(o.identifier,i):be(o.ref,{entry:n,index:i,resource:n.resource});n.refs.push({path:o.path,ref:o.ref,identifier:o.identifier,...f})}for(let n of t)n.incoming=[];for(let n of t)for(let o of n.refs){let f=o.status==="resolved"||o.status==="contained"?[o.index]:o.status==="ambiguous"?o.indexes:[];for(let c of f)c!==n.index&&t[c]&&t[c].incoming.push({from:n.index,path:o.path})}return{isBundle:r,resource:e,entries:t,index:i,typeCounts:l}}var Je=/^([0-9]([0-9]([0-9][1-9]|[1-9]0)|[1-9]00)|[1-9]000)(-(0[1-9]|1[0-2])(-(0[1-9]|[1-2][0-9]|3[0-1]))?)?$/,He=/^([0-9]([0-9]([0-9][1-9]|[1-9]0)|[1-9]00)|[1-9]000)(-(0[1-9]|1[0-2])(-(0[1-9]|[1-2][0-9]|3[0-1])(T([01][0-9]|2[0-3]):[0-5][0-9]:([0-5][0-9]|60)(\.[0-9]+)?(Z|(\+|-)((0[0-9]|1[0-3]):[0-5][0-9]|14:00)))?)?)?$/,Ke=/^([0-9]([0-9]([0-9][1-9]|[1-9]0)|[1-9]00)|[1-9]000)-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])T([01][0-9]|2[0-3]):[0-5][0-9]:([0-5][0-9]|60)(\.[0-9]+)?(Z|(\+|-)((0[0-9]|1[0-3]):[0-5][0-9]|14:00))$/,We=/^[A-Za-z0-9\-.]{1,64}$/,Se={birthDate:Je},Ze=/(DateTime|dateTime)$|^(recordedDate|authoredOn|date)$/,_e=new Set(["issued","lastUpdated","instant"]),Ve={Observation:["status","code"],Condition:["subject"],Encounter:["status"],MedicationRequest:["status","intent","subject"],DiagnosticReport:["status","code"],Bundle:["type"]},Xe={"Patient.gender":["male","female","other","unknown"],"Bundle.type":ne,"Observation.status":["registered","preliminary","final","amended","corrected","cancelled","entered-in-error","unknown"]};function ke(e){let r=[],t=(n,o,f,c={})=>r.push({level:n,where:o,msg:f,...c}),i=e.resource;if(!i.resourceType)return t("error","Wurzel",'Das Objekt hat kein Feld "resourceType". Ohne dieses Feld ist es keine FHIR-Ressource. Erwartet wird zum Beispiel "resourceType": "Patient".'),r;if(typeof i.resourceType!="string")return t("error","Wurzel",'"resourceType" muss ein Text sein.'),r;let l=(n,o)=>{xe.has(n.resourceType)||t("warn",o,`Der Ressourcentyp "${n.resourceType}" steht nicht in der Liste von R4 (4.0.1). Das kann ein Tippfehler sein (Gro\xDF-/Kleinschreibung z\xE4hlt) oder ein Typ aus einer neueren Version.`)};if(l(i,i.resourceType),e.isBundle){let n=i.type;n?ne.includes(n)||t("warn","Bundle.type",`"${n}" ist kein Wert aus der Liste der Bundle-Typen (${ne.join(", ")}).`):t("warn","Bundle.type","Bundle.type fehlt. Das Feld ist in R4 ein Pflichtfeld (1..1)."),i.entry!==void 0&&!Array.isArray(i.entry)&&t("error","Bundle.entry","Bundle.entry muss ein Array sein."),i.total!==void 0&&n&&!["searchset","history"].includes(n)&&t("warn","Bundle.total","Bundle.total darf laut Regel bdl-1 nur bei Bundles vom Typ searchset oder history stehen.");let o=n==="transaction"||n==="batch",f=new Map;if(e.entries.forEach((c,v)=>{let T=`Bundle.entry[${v}]`;if(!c.raw||typeof c.raw!="object"){t("error",T,"Der Eintrag ist kein Objekt.");return}if(!c.fullUrl&&!o&&n&&t("warn",T,'fullUrl fehlt. Au\xDFer bei transaction und batch braucht jeder Eintrag eine fullUrl (Bundle, Abschnitt "Resource URL & Uniqueness rules").',{entry:v}),c.fullUrl&&n!=="history"){let N=c.fullUrl+"|"+(c.resource?.meta?.versionId||"");f.has(N)&&t("warn",T,`fullUrl ${c.fullUrl} kommt mehrfach vor (Regel bdl-7: nur erlaubt, wenn sich meta.versionId unterscheidet).`,{entry:v}),f.set(N,v)}c.resource?l(c.resource,`${T}.resource`):!c.raw.request&&!c.raw.response&&t("warn",T,"Der Eintrag enth\xE4lt weder resource noch request noch response.",{entry:v});let x=["batch","transaction","history"].includes(n),$=["batch-response","transaction-response","history"].includes(n);x&&!c.raw.request&&t("warn",T,`Bei Bundle.type "${n}" ist entry.request Pflicht (Regel bdl-3).`,{entry:v}),!x&&c.raw.request&&n&&t("warn",T,`Bei Bundle.type "${n}" darf entry.request nicht vorkommen (Regel bdl-3).`,{entry:v}),$&&!c.raw.response&&t("warn",T,`Bei Bundle.type "${n}" ist entry.response Pflicht (Regel bdl-4).`,{entry:v}),!$&&c.raw.response&&n&&t("warn",T,`Bei Bundle.type "${n}" darf entry.response nicht vorkommen (Regel bdl-4).`,{entry:v})}),n==="document"){let c=e.entries[0]?.resource;(!c||c.resourceType!=="Composition")&&t("warn","Bundle (document)","Ein Dokument-Bundle muss als erste Ressource eine Composition enthalten (Regel bdl-11)."),(!i.identifier||!i.identifier.system||!i.identifier.value)&&t("warn","Bundle (document)","Ein Dokument-Bundle braucht einen identifier mit system und value (Regel bdl-9)."),i.timestamp||t("warn","Bundle (document)","Ein Dokument-Bundle braucht einen timestamp (Regel bdl-10).")}if(n==="message"){let c=e.entries[0]?.resource;(!c||c.resourceType!=="MessageHeader")&&t("warn","Bundle (message)","Ein Message-Bundle muss als erste Ressource einen MessageHeader enthalten (Regel bdl-12).")}}return e.entries.forEach(n=>{if(!n.resource)return;let o=n.resource,f=e.isBundle?`Eintrag ${n.index+1} (${o.resourceType||"?"}${o.id?"/"+o.id:""})`:o.resourceType;if(!o.resourceType){t("error",f,'Der Eintrag hat kein "resourceType".',{entry:n.index});return}o.id!==void 0&&(typeof o.id!="string"||!We.test(o.id))&&t("warn",f,`id "${o.id}" ist ung\xFCltig: erlaubt sind Buchstaben, Ziffern, "-" und ".", h\xF6chstens 64 Zeichen.`,{entry:n.index});for(let c of Ve[o.resourceType]||[])o[c]!==void 0||Object.keys(o).some(T=>T.startsWith(c)&&/[A-Z]/.test(T[c.length]||""))||t("warn",f,`Pflichtfeld "${c}" fehlt (in R4 mit Kardinalit\xE4t 1..1).`,{entry:n.index});o.resourceType==="MedicationRequest"&&!Object.keys(o).some(c=>c.startsWith("medication"))&&t("warn",f,"medication[x] fehlt (in R4 Pflicht: medicationCodeableConcept oder medicationReference; Daten aus anderen FHIR-Versionen benennen das Feld wom\xF6glich anders).",{entry:n.index}),o.resourceType==="Encounter"&&o.class===void 0&&t("info",f,"Encounter.class fehlt. In R4 ist das Feld Pflicht (1..1); bei Daten aus anderen FHIR-Versionen kann die Anforderung abweichen.",{entry:n.index});for(let[c,v]of Object.entries(Xe)){let[T,x]=c.split(".");o.resourceType===T&&x!=="type"&&typeof o[x]=="string"&&!v.includes(o[x])&&t("warn",f,`${c}: "${o[x]}" steht nicht in der Werteliste (${v.join(", ")}).`,{entry:n.index})}if(o.resourceType==="Observation"){let c=Object.keys(o).filter(v=>/^value[A-Z]/.test(v));c.length>1&&t("error",f,`Mehrere value[x]-Felder gleichzeitig (${c.join(", ")}). Es darf nur eines vorkommen.`,{entry:n.index}),o.dataAbsentReason&&c.length&&t("warn",f,"dataAbsentReason und ein Wert stehen gleichzeitig. Laut Regel obs-6 darf dataAbsentReason nur ohne value[x] vorkommen.",{entry:n.index})}if(o.resourceType==="Condition"&&o.clinicalStatus&&o.verificationStatus){let c=JSON.stringify(o.verificationStatus);/entered-in-error/.test(c)&&t("warn",f,'clinicalStatus darf bei verificationStatus "entered-in-error" nicht vorkommen (Regel con-5).',{entry:n.index})}te(o,(c,v,T)=>{Array.isArray(v)&&v.length===0?t("warn",f,`${T}: leeres Array. In FHIR-JSON werden leere Arrays weggelassen.`,{entry:n.index}):v===""?t("warn",f,`${T}: leerer Text. In FHIR-JSON d\xFCrfen Texte nicht leer sein.`,{entry:n.index}):v===null?t("warn",f,`${T}: null. In FHIR-JSON gibt es keine null-Werte (au\xDFer in Platzhalter-Arrays f\xFCr Primitive mit Erweiterung).`,{entry:n.index}):typeof v=="string"&&(Se[c]&&!Se[c].test(v)?t("warn",f,`${T}: "${v}" ist kein g\xFCltiges FHIR-date (erwartet JJJJ, JJJJ-MM oder JJJJ-MM-TT).`,{entry:n.index}):Ze.test(c)&&!He.test(v)?t("warn",f,`${T}: "${v}" ist kein g\xFCltiges FHIR-dateTime (erwartet z. B. 2016-03-28 oder 2016-03-28T10:15:00+01:00; bei Uhrzeit ist eine Zeitzone Pflicht).`,{entry:n.index}):_e.has(c)&&!Ke.test(v)&&t("warn",f,`${T}: "${v}" ist kein g\xFCltiger FHIR-instant (erwartet Datum, Uhrzeit mit Sekunden und Zeitzone).`,{entry:n.index}))});for(let c of n.refs)if(c.status==="unresolved")if(e.isBundle){let v=c.external?" Externe Server-URLs lassen sich ohne Netzwerkzugriff nicht pr\xFCfen.":"";t(c.external?"info":"warn",f,`Referenz ${c.path}${c.ref?' = "'+c.ref+'"':" (per Identifier)"}: ${c.reason||"nicht aufl\xF6sbar"}.${v}`,{entry:n.index})}else c.ref&&c.ref[0]==="#"&&t("warn",f,`Referenz ${c.path} = "${c.ref}": ${c.reason}.`,{entry:n.index});else c.status==="ambiguous"?t("warn",f,`Referenz ${c.path} = "${c.ref||"Identifier"}" ist mehrdeutig: mehrere Eintr\xE4ge passen.`,{entry:n.index}):c.method==="typ-id"&&t("info",f,`Referenz ${c.path} = "${c.ref}" wurde nur \xFCber Typ und id gefunden, nicht \xFCber die fullUrl. Nach der Spezifikation ist die Aufl\xF6sung hier nicht definiert.`,{entry:n.index})}),r}function te(e,r,t="",i=""){if(Array.isArray(e)){e.forEach((l,n)=>{l===null&&i.startsWith("_")||te(l,r,t+"["+n+"]",i)});return}if(e&&typeof e=="object")for(let[l,n]of Object.entries(e)){if(l==="text"&&t==="")continue;let o=t?t+"."+l:l;(Array.isArray(n)||n===""||n===null||typeof n=="string")&&r(l,n,o),n&&typeof n=="object"&&te(n,r,o,l)}}function Te(e){let r=[];for(let t of e.entries){let i=t.resource;i&&(i.resourceType==="Encounter"&&(i.actualPeriod||Array.isArray(i.class))&&r.push("Encounter mit actualPeriod bzw. class als Liste"),i.resourceType==="MedicationRequest"&&i.medication&&typeof i.medication=="object"&&(i.medication.concept||i.medication.reference)&&r.push("MedicationRequest.medication als CodeableReference"))}return[...new Set(r)]}var Qe={Patient:["identifier","active","name","gender","birthDate","deceased[x]","telecom","address","maritalStatus","communication","contact","generalPractitioner","managingOrganization"],Observation:["status","category","code","subject","encounter","effective[x]","issued","performer","value[x]","dataAbsentReason","interpretation","note","bodySite","method","referenceRange","component","hasMember","basedOn"],Encounter:["identifier","status","class","type","serviceType","priority","subject","participant","period","actualPeriod","length","reasonCode","reasonReference","diagnosis","hospitalization","location","serviceProvider"],Condition:["clinicalStatus","verificationStatus","category","severity","code","bodySite","subject","encounter","onset[x]","abatement[x]","recordedDate","recorder","asserter","stage","evidence","note"],MedicationRequest:["status","intent","category","priority","medication[x]","subject","encounter","authoredOn","requester","reasonCode","dosageInstruction","dispenseRequest","substitution","note"],DiagnosticReport:["status","category","code","subject","encounter","effective[x]","issued","performer","result","conclusion","conclusionCode","presentedForm"],Medication:["code","status","form","amount","ingredient","manufacturer"],Practitioner:["identifier","active","name","telecom","address","gender","birthDate","qualification"],Organization:["identifier","active","type","name","alias","telecom","address","partOf"],Procedure:["status","category","code","subject","encounter","performed[x]","performer","reasonCode","bodySite","outcome","note"],Immunization:["status","vaccineCode","patient","encounter","occurrence[x]","lotNumber","performer","note"],AllergyIntolerance:["clinicalStatus","verificationStatus","type","category","criticality","code","patient","onset[x]","recordedDate","reaction","note"]};function Re(e){if(!U(e))return[];let r=Qe[e.resourceType],t=[],i=new Set,l=(n,o,f)=>{t.push({label:n,key:o,value:f}),i.add(o)};if(r)for(let n of r)if(n.endsWith("[x]")){let o=n.slice(0,-3),f=G(e,o);f&&f.value!==void 0&&l(f.key,f.key,f.value)}else e[n]!==void 0&&l(n,n,e[n]);for(let[n,o]of Object.entries(e))me.has(n)||i.has(n)||n.startsWith("_")||l(n,n,o);return t}var re=[{id:"patient",file:"patient-example",title:"Patient",desc:"Eine Patientenressource mit Name, Adresse, Telefon und Kontakt.",resource:"Patient",removedSnomed:0,bytes:3748,url:"https://hl7.org/fhir/R4/patient-example.json.html",json:`{
  "resourceType": "Patient",
  "id": "example",
  "text": {
    "status": "generated",
    "div": "<div xmlns=\\"http://www.w3.org/1999/xhtml\\">\\n\\t\\t\\t<table>\\n\\t\\t\\t\\t<tbody>\\n\\t\\t\\t\\t\\t<tr>\\n\\t\\t\\t\\t\\t\\t<td>Name</td>\\n\\t\\t\\t\\t\\t\\t<td>Peter James \\n              <b>Chalmers</b> (&quot;Jim&quot;)\\n            </td>\\n\\t\\t\\t\\t\\t</tr>\\n\\t\\t\\t\\t\\t<tr>\\n\\t\\t\\t\\t\\t\\t<td>Address</td>\\n\\t\\t\\t\\t\\t\\t<td>534 Erewhon, Pleasantville, Vic, 3999</td>\\n\\t\\t\\t\\t\\t</tr>\\n\\t\\t\\t\\t\\t<tr>\\n\\t\\t\\t\\t\\t\\t<td>Contacts</td>\\n\\t\\t\\t\\t\\t\\t<td>Home: unknown. Work: (03) 5555 6473</td>\\n\\t\\t\\t\\t\\t</tr>\\n\\t\\t\\t\\t\\t<tr>\\n\\t\\t\\t\\t\\t\\t<td>Id</td>\\n\\t\\t\\t\\t\\t\\t<td>MRN: 12345 (Acme Healthcare)</td>\\n\\t\\t\\t\\t\\t</tr>\\n\\t\\t\\t\\t</tbody>\\n\\t\\t\\t</table>\\n\\t\\t</div>"
  },
  "identifier": [
    {
      "use": "usual",
      "type": {
        "coding": [
          {
            "system": "http://terminology.hl7.org/CodeSystem/v2-0203",
            "code": "MR"
          }
        ]
      },
      "system": "urn:oid:1.2.36.146.595.217.0.1",
      "value": "12345",
      "period": {
        "start": "2001-05-06"
      },
      "assigner": {
        "display": "Acme Healthcare"
      }
    }
  ],
  "active": true,
  "name": [
    {
      "use": "official",
      "family": "Chalmers",
      "given": [
        "Peter",
        "James"
      ]
    },
    {
      "use": "usual",
      "given": [
        "Jim"
      ]
    },
    {
      "use": "maiden",
      "family": "Windsor",
      "given": [
        "Peter",
        "James"
      ],
      "period": {
        "end": "2002"
      }
    }
  ],
  "telecom": [
    {
      "use": "home"
    },
    {
      "system": "phone",
      "value": "(03) 5555 6473",
      "use": "work",
      "rank": 1
    },
    {
      "system": "phone",
      "value": "(03) 3410 5613",
      "use": "mobile",
      "rank": 2
    },
    {
      "system": "phone",
      "value": "(03) 5555 8834",
      "use": "old",
      "period": {
        "end": "2014"
      }
    }
  ],
  "gender": "male",
  "birthDate": "1974-12-25",
  "_birthDate": {
    "extension": [
      {
        "url": "http://hl7.org/fhir/StructureDefinition/patient-birthTime",
        "valueDateTime": "1974-12-25T14:35:45-05:00"
      }
    ]
  },
  "deceasedBoolean": false,
  "address": [
    {
      "use": "home",
      "type": "both",
      "text": "534 Erewhon St PeasantVille, Rainbow, Vic  3999",
      "line": [
        "534 Erewhon St"
      ],
      "city": "PleasantVille",
      "district": "Rainbow",
      "state": "Vic",
      "postalCode": "3999",
      "period": {
        "start": "1974-12-25"
      }
    }
  ],
  "contact": [
    {
      "relationship": [
        {
          "coding": [
            {
              "system": "http://terminology.hl7.org/CodeSystem/v2-0131",
              "code": "N"
            }
          ]
        }
      ],
      "name": {
        "family": "du March\xE9",
        "_family": {
          "extension": [
            {
              "url": "http://hl7.org/fhir/StructureDefinition/humanname-own-prefix",
              "valueString": "VV"
            }
          ]
        },
        "given": [
          "B\xE9n\xE9dicte"
        ]
      },
      "telecom": [
        {
          "system": "phone",
          "value": "+33 (237) 998327"
        }
      ],
      "address": {
        "use": "home",
        "type": "both",
        "line": [
          "534 Erewhon St"
        ],
        "city": "PleasantVille",
        "district": "Rainbow",
        "state": "Vic",
        "postalCode": "3999",
        "period": {
          "start": "1974-12-25"
        }
      },
      "gender": "female",
      "period": {
        "start": "2012"
      }
    }
  ],
  "managingOrganization": {
    "reference": "Organization/1"
  }
}`},{id:"observation",file:"observation-example",title:"Observation (K\xF6rpergewicht)",desc:"Eine Messung mit LOINC-Code, Wert (valueQuantity) und Einheit.",resource:"Observation",removedSnomed:1,bytes:1e3,url:"https://hl7.org/fhir/R4/observation-example.json.html",json:`{
  "resourceType": "Observation",
  "id": "example",
  "status": "final",
  "category": [
    {
      "coding": [
        {
          "system": "http://terminology.hl7.org/CodeSystem/observation-category",
          "code": "vital-signs",
          "display": "Vital Signs"
        }
      ]
    }
  ],
  "code": {
    "coding": [
      {
        "system": "http://loinc.org",
        "code": "29463-7",
        "display": "Body Weight"
      },
      {
        "system": "http://loinc.org",
        "code": "3141-9",
        "display": "Body weight Measured"
      },
      {
        "system": "http://acme.org/devices/clinical-codes",
        "code": "body-weight",
        "display": "Body Weight"
      }
    ]
  },
  "subject": {
    "reference": "Patient/example"
  },
  "encounter": {
    "reference": "Encounter/example"
  },
  "effectiveDateTime": "2016-03-28",
  "valueQuantity": {
    "value": 185,
    "unit": "lbs",
    "system": "http://unitsofmeasure.org",
    "code": "[lb_av]"
  }
}`},{id:"blutdruck",file:"observation-example-bloodpressure",title:"Observation (Blutdruck)",desc:"Eine Observation mit zwei component-Werten (systolisch, diastolisch), Interpretation und einer Referenz per Identifier.",resource:"Observation",removedSnomed:2,bytes:2870,url:"https://hl7.org/fhir/R4/observation-example-bloodpressure.json.html",json:`{
  "resourceType": "Observation",
  "id": "blood-pressure",
  "meta": {
    "profile": [
      "http://hl7.org/fhir/StructureDefinition/vitalsigns"
    ]
  },
  "identifier": [
    {
      "system": "urn:ietf:rfc:3986",
      "value": "urn:uuid:187e0c12-8dd2-67e2-99b2-bf273c878281"
    }
  ],
  "basedOn": [
    {
      "identifier": {
        "system": "https://acme.org/identifiers",
        "value": "1234"
      }
    }
  ],
  "status": "final",
  "category": [
    {
      "coding": [
        {
          "system": "http://terminology.hl7.org/CodeSystem/observation-category",
          "code": "vital-signs",
          "display": "Vital Signs"
        }
      ]
    }
  ],
  "code": {
    "coding": [
      {
        "system": "http://loinc.org",
        "code": "85354-9",
        "display": "Blood pressure panel with all children optional"
      }
    ],
    "text": "Blood pressure systolic & diastolic"
  },
  "subject": {
    "reference": "Patient/example"
  },
  "effectiveDateTime": "2012-09-17",
  "performer": [
    {
      "reference": "Practitioner/example"
    }
  ],
  "interpretation": [
    {
      "coding": [
        {
          "system": "http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation",
          "code": "L",
          "display": "low"
        }
      ],
      "text": "Below low normal"
    }
  ],
  "component": [
    {
      "code": {
        "coding": [
          {
            "system": "http://loinc.org",
            "code": "8480-6",
            "display": "Systolic blood pressure"
          },
          {
            "system": "http://acme.org/devices/clinical-codes",
            "code": "bp-s",
            "display": "Systolic Blood pressure"
          }
        ]
      },
      "valueQuantity": {
        "value": 107,
        "unit": "mmHg",
        "system": "http://unitsofmeasure.org",
        "code": "mm[Hg]"
      },
      "interpretation": [
        {
          "coding": [
            {
              "system": "http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation",
              "code": "N",
              "display": "normal"
            }
          ],
          "text": "Normal"
        }
      ]
    },
    {
      "code": {
        "coding": [
          {
            "system": "http://loinc.org",
            "code": "8462-4",
            "display": "Diastolic blood pressure"
          }
        ]
      },
      "valueQuantity": {
        "value": 60,
        "unit": "mmHg",
        "system": "http://unitsofmeasure.org",
        "code": "mm[Hg]"
      },
      "interpretation": [
        {
          "coding": [
            {
              "system": "http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation",
              "code": "L",
              "display": "low"
            }
          ],
          "text": "Below low normal"
        }
      ]
    }
  ]
}`},{id:"condition",file:"condition-example",title:"Condition",desc:"Eine Diagnose mit Freitext-Code, Status, Kategorie, K\xF6rperstelle und Beginn.",resource:"Condition",removedSnomed:4,bytes:827,url:"https://hl7.org/fhir/R4/condition-example.json.html",json:`{
  "resourceType": "Condition",
  "id": "example",
  "clinicalStatus": {
    "coding": [
      {
        "system": "http://terminology.hl7.org/CodeSystem/condition-clinical",
        "code": "active"
      }
    ]
  },
  "verificationStatus": {
    "coding": [
      {
        "system": "http://terminology.hl7.org/CodeSystem/condition-ver-status",
        "code": "confirmed"
      }
    ]
  },
  "category": [
    {
      "coding": [
        {
          "system": "http://terminology.hl7.org/CodeSystem/condition-category",
          "code": "encounter-diagnosis",
          "display": "Encounter Diagnosis"
        }
      ]
    }
  ],
  "code": {
    "text": "Burnt Ear"
  },
  "bodySite": [
    {
      "text": "Left Ear"
    }
  ],
  "subject": {
    "reference": "Patient/example"
  },
  "onsetDateTime": "2012-05-24"
}`},{id:"encounter",file:"encounter-example",title:"Encounter",desc:"Ein sehr kurzer Behandlungsfall mit Status und Klasse.",resource:"Encounter",removedSnomed:0,bytes:413,url:"https://hl7.org/fhir/R4/encounter-example.json.html",json:`{
  "resourceType": "Encounter",
  "id": "example",
  "text": {
    "status": "generated",
    "div": "<div xmlns=\\"http://www.w3.org/1999/xhtml\\">Encounter with patient @example</div>"
  },
  "status": "in-progress",
  "class": {
    "system": "http://terminology.hl7.org/CodeSystem/v3-ActCode",
    "code": "IMP",
    "display": "inpatient encounter"
  },
  "subject": {
    "reference": "Patient/example"
  }
}`},{id:"bundle-verweise",file:"bundle-references",title:"Bundle mit Referenzen",desc:"Ein Bundle mit Patienten und Observations; zeigt aufgel\xF6ste Referenzen, Versionen und Identifier.",resource:"Bundle",removedSnomed:0,bytes:8732,url:"https://hl7.org/fhir/R4/bundle-references.json.html",json:`{
  "resourceType": "Bundle",
  "id": "bundle-references",
  "type": "collection",
  "entry": [
    {
      "fullUrl": "http://example.org/fhir/Patient/23",
      "resource": {
        "resourceType": "Patient",
        "id": "23",
        "text": {
          "status": "generated",
          "div": "<div xmlns=\\"http://www.w3.org/1999/xhtml\\"><p><b>Generated Narrative with Details</b></p><p><b>id</b>: 23</p><p><b>identifier</b>: 1234567</p></div>"
        },
        "identifier": [
          {
            "system": "http://example.org/ids",
            "value": "1234567"
          }
        ]
      }
    },
    {
      "fullUrl": "urn:uuid:04121321-4af5-424c-a0e1-ed3aab1c349d",
      "resource": {
        "resourceType": "Patient",
        "text": {
          "status": "generated",
          "div": "<div xmlns=\\"http://www.w3.org/1999/xhtml\\"><p><b>Generated Narrative with Details</b></p></div>"
        }
      }
    },
    {
      "fullUrl": "http://example.org/fhir/Observation/123",
      "resource": {
        "resourceType": "Observation",
        "id": "123",
        "text": {
          "status": "generated",
          "div": "<div xmlns=\\"http://www.w3.org/1999/xhtml\\"><p><b>Generated Narrative with Details</b></p><p><b>id</b>: 123</p><p><b>status</b>: final</p><p><b>code</b>: Glucose [Moles/volume] in Blood <span>(Details : {LOINC code '15074-8' = 'Glucose [Moles/volume] in Blood', given as 'Glucose [Moles/volume] in Blood'})</span></p><p><b>subject</b>: <a>Patient/23</a></p></div>"
        },
        "status": "final",
        "code": {
          "coding": [
            {
              "system": "http://loinc.org",
              "code": "15074-8",
              "display": "Glucose [Moles/volume] in Blood"
            }
          ]
        },
        "subject": {
          "reference": "Patient/23"
        }
      }
    },
    {
      "fullUrl": "http://example.org/fhir/Observation/124",
      "resource": {
        "resourceType": "Observation",
        "id": "124",
        "text": {
          "status": "generated",
          "div": "<div xmlns=\\"http://www.w3.org/1999/xhtml\\"><p><b>Generated Narrative with Details</b></p><p><b>id</b>: 124</p><p><b>status</b>: final</p><p><b>code</b>: Glucose [Moles/volume] in Blood <span>(Details : {LOINC code '15074-8' = 'Glucose [Moles/volume] in Blood', given as 'Glucose [Moles/volume] in Blood'})</span></p><p><b>subject</b>: <a>http://example.org/fhir/Patient/23</a></p></div>"
        },
        "status": "final",
        "code": {
          "coding": [
            {
              "system": "http://loinc.org",
              "code": "15074-8",
              "display": "Glucose [Moles/volume] in Blood"
            }
          ]
        },
        "subject": {
          "reference": "http://example.org/fhir/Patient/23"
        }
      }
    },
    {
      "fullUrl": "http://example.org/fhir/Observation/12",
      "resource": {
        "resourceType": "Observation",
        "id": "12",
        "text": {
          "status": "generated",
          "div": "<div xmlns=\\"http://www.w3.org/1999/xhtml\\"><p><b>Generated Narrative with Details</b></p><p><b>id</b>: 12</p><p><b>status</b>: final</p><p><b>code</b>: Glucose [Moles/volume] in Blood <span>(Details : {LOINC code '15074-8' = 'Glucose [Moles/volume] in Blood', given as 'Glucose [Moles/volume] in Blood'})</span></p><p><b>subject</b>: <a>urn:uuid:04121321-4af5-424c-a0e1-ed3aab1c349d</a></p></div>"
        },
        "status": "final",
        "code": {
          "coding": [
            {
              "system": "http://loinc.org",
              "code": "15074-8",
              "display": "Glucose [Moles/volume] in Blood"
            }
          ]
        },
        "subject": {
          "reference": "urn:uuid:04121321-4af5-424c-a0e1-ed3aab1c349d"
        }
      }
    },
    {
      "fullUrl": "http://example.org/fhir/Observation/14",
      "resource": {
        "resourceType": "Observation",
        "id": "14",
        "text": {
          "status": "generated",
          "div": "<div xmlns=\\"http://www.w3.org/1999/xhtml\\"><p><b>Generated Narrative with Details</b></p><p><b>id</b>: 14</p><p><b>status</b>: final</p><p><b>code</b>: Glucose [Moles/volume] in Blood <span>(Details : {LOINC code '15074-8' = 'Glucose [Moles/volume] in Blood', given as 'Glucose [Moles/volume] in Blood'})</span></p><p><b>subject</b>: <a>http://example.org/fhir-2/Patient/1</a></p></div>"
        },
        "status": "final",
        "code": {
          "coding": [
            {
              "system": "http://loinc.org",
              "code": "15074-8",
              "display": "Glucose [Moles/volume] in Blood"
            }
          ]
        },
        "subject": {
          "reference": "http://example.org/fhir-2/Patient/1"
        }
      }
    },
    {
      "fullUrl": "http://example.org/fhir-2/Observation/14",
      "resource": {
        "resourceType": "Observation",
        "id": "14",
        "text": {
          "status": "generated",
          "div": "<div xmlns=\\"http://www.w3.org/1999/xhtml\\"><p><b>Generated Narrative with Details</b></p><p><b>id</b>: 14</p><p><b>status</b>: final</p><p><b>code</b>: Glucose [Moles/volume] in Blood <span>(Details : {LOINC code '15074-8' = 'Glucose [Moles/volume] in Blood', given as 'Glucose [Moles/volume] in Blood'})</span></p><p><b>subject</b>: <a>Patient/23</a></p></div>"
        },
        "status": "final",
        "code": {
          "coding": [
            {
              "system": "http://loinc.org",
              "code": "15074-8",
              "display": "Glucose [Moles/volume] in Blood"
            }
          ]
        },
        "subject": {
          "reference": "Patient/23"
        }
      }
    },
    {
      "fullUrl": "http://example.org/fhir/Patient/45",
      "resource": {
        "resourceType": "Patient",
        "id": "45",
        "meta": {
          "versionId": "1"
        },
        "text": {
          "status": "generated",
          "div": "<div xmlns=\\"http://www.w3.org/1999/xhtml\\"><p><b>Generated Narrative with Details</b></p><p><b>id</b>: 45</p><p><b>meta</b>: </p><p><b>name</b>: Name 1</p></div>"
        },
        "name": [
          {
            "text": "Name 1"
          }
        ]
      }
    },
    {
      "fullUrl": "http://example.org/fhir/Patient/45",
      "resource": {
        "resourceType": "Patient",
        "id": "45",
        "meta": {
          "versionId": "2"
        },
        "text": {
          "status": "generated",
          "div": "<div xmlns=\\"http://www.w3.org/1999/xhtml\\"><p><b>Generated Narrative with Details</b></p><p><b>id</b>: 45</p><p><b>meta</b>: </p><p><b>name</b>: Name 2</p></div>"
        },
        "name": [
          {
            "text": "Name 2"
          }
        ]
      }
    },
    {
      "fullUrl": "http://example.org/fhir/Observation/47",
      "resource": {
        "resourceType": "Observation",
        "id": "47",
        "text": {
          "status": "generated",
          "div": "<div xmlns=\\"http://www.w3.org/1999/xhtml\\"><p><b>Generated Narrative with Details</b></p><p><b>id</b>: 47</p><p><b>status</b>: final</p><p><b>code</b>: Glucose [Moles/volume] in Blood <span>(Details : {LOINC code '15074-8' = 'Glucose [Moles/volume] in Blood', given as 'Glucose [Moles/volume] in Blood'})</span></p><p><b>subject</b>: <a>Patient/45/_history/2</a></p></div>"
        },
        "status": "final",
        "code": {
          "coding": [
            {
              "system": "http://loinc.org",
              "code": "15074-8",
              "display": "Glucose [Moles/volume] in Blood"
            }
          ]
        },
        "subject": {
          "reference": "Patient/45/_history/2"
        }
      }
    },
    {
      "fullUrl": "http://example.org/fhir/Observation/48",
      "resource": {
        "resourceType": "Observation",
        "id": "48",
        "text": {
          "status": "generated",
          "div": "<div xmlns=\\"http://www.w3.org/1999/xhtml\\"><p><b>Generated Narrative with Details</b></p><p><b>id</b>: 48</p><p><b>status</b>: final</p><p><b>code</b>: Glucose [Moles/volume] in Blood <span>(Details : {LOINC code '15074-8' = 'Glucose [Moles/volume] in Blood', given as 'Glucose [Moles/volume] in Blood'})</span></p><p><b>subject</b>: </p></div>"
        },
        "status": "final",
        "code": {
          "coding": [
            {
              "system": "http://loinc.org",
              "code": "15074-8",
              "display": "Glucose [Moles/volume] in Blood"
            }
          ]
        },
        "subject": {
          "identifier": {
            "system": "http://example.org/ids",
            "value": "1234567"
          }
        }
      }
    }
  ]
}`},{id:"bundle-suche",file:"bundle-example",title:"Bundle (searchset)",desc:"Ein kleines Suchergebnis mit MedicationRequest und Medication.",resource:"Bundle",removedSnomed:0,bytes:1733,url:"https://hl7.org/fhir/R4/bundle-example.json.html",json:`{
  "resourceType": "Bundle",
  "id": "bundle-example",
  "meta": {
    "lastUpdated": "2014-08-18T01:43:30Z"
  },
  "type": "searchset",
  "total": 3,
  "link": [
    {
      "relation": "self",
      "url": "https://example.com/base/MedicationRequest?patient=347&_include=MedicationRequest.medication&_count=2"
    },
    {
      "relation": "next",
      "url": "https://example.com/base/MedicationRequest?patient=347&searchId=ff15fd40-ff71-4b48-b366-09c706bed9d0&page=2"
    }
  ],
  "entry": [
    {
      "fullUrl": "https://example.com/base/MedicationRequest/3123",
      "resource": {
        "resourceType": "MedicationRequest",
        "id": "3123",
        "text": {
          "status": "generated",
          "div": "<div xmlns=\\"http://www.w3.org/1999/xhtml\\"><p><b>Generated Narrative with Details</b></p><p><b>id</b>: 3123</p><p><b>status</b>: unknown</p><p><b>intent</b>: order</p><p><b>medication</b>: <a>Medication/example</a></p><p><b>subject</b>: <a>Patient/347</a></p></div>"
        },
        "status": "unknown",
        "intent": "order",
        "medicationReference": {
          "reference": "Medication/example"
        },
        "subject": {
          "reference": "Patient/347"
        }
      },
      "search": {
        "mode": "match",
        "score": 1
      }
    },
    {
      "fullUrl": "https://example.com/base/Medication/example",
      "resource": {
        "resourceType": "Medication",
        "id": "example",
        "text": {
          "status": "generated",
          "div": "<div xmlns=\\"http://www.w3.org/1999/xhtml\\"><p><b>Generated Narrative with Details</b></p><p><b>id</b>: example</p></div>"
        }
      },
      "search": {
        "mode": "include"
      }
    }
  ]
}`},{id:"bundle-transaktion",file:"bundle-transaction",title:"Bundle (transaction)",desc:"Eine Transaktion mit mehreren Patienten und request-Angaben.",resource:"Bundle",removedSnomed:0,bytes:4807,url:"https://hl7.org/fhir/R4/bundle-transaction.json.html",json:`{
  "resourceType": "Bundle",
  "id": "bundle-transaction",
  "meta": {
    "lastUpdated": "2014-08-18T01:43:30Z"
  },
  "type": "transaction",
  "entry": [
    {
      "fullUrl": "urn:uuid:61ebe359-bfdc-4613-8bf2-c5e300945f0a",
      "resource": {
        "resourceType": "Patient",
        "text": {
          "status": "generated",
          "div": "<div xmlns=\\"http://www.w3.org/1999/xhtml\\">Some narrative</div>"
        },
        "active": true,
        "name": [
          {
            "use": "official",
            "family": "Chalmers",
            "given": [
              "Peter",
              "James"
            ]
          }
        ],
        "gender": "male",
        "birthDate": "1974-12-25"
      },
      "request": {
        "method": "POST",
        "url": "Patient"
      }
    },
    {
      "fullUrl": "urn:uuid:88f151c0-a954-468a-88bd-5ae15c08e059",
      "resource": {
        "resourceType": "Patient",
        "text": {
          "status": "generated",
          "div": "<div xmlns=\\"http://www.w3.org/1999/xhtml\\">Some narrative</div>"
        },
        "identifier": [
          {
            "system": "http:/example.org/fhir/ids",
            "value": "234234"
          }
        ],
        "active": true,
        "name": [
          {
            "use": "official",
            "family": "Chalmers",
            "given": [
              "Peter",
              "James"
            ]
          }
        ],
        "gender": "male",
        "birthDate": "1974-12-25"
      },
      "request": {
        "method": "POST",
        "url": "Patient",
        "ifNoneExist": "identifier=http:/example.org/fhir/ids|234234"
      }
    },
    {
      "fullUrl": "http://example.org/fhir/Patient/123",
      "resource": {
        "resourceType": "Patient",
        "id": "123",
        "text": {
          "status": "generated",
          "div": "<div xmlns=\\"http://www.w3.org/1999/xhtml\\">Some narrative</div>"
        },
        "active": true,
        "name": [
          {
            "use": "official",
            "family": "Chalmers",
            "given": [
              "Peter",
              "James"
            ]
          }
        ],
        "gender": "male",
        "birthDate": "1974-12-25"
      },
      "request": {
        "method": "PUT",
        "url": "Patient/123"
      }
    },
    {
      "fullUrl": "urn:uuid:74891afc-ed52-42a2-bcd7-f13d9b60f096",
      "resource": {
        "resourceType": "Patient",
        "text": {
          "status": "generated",
          "div": "<div xmlns=\\"http://www.w3.org/1999/xhtml\\">Some narrative</div>"
        },
        "identifier": [
          {
            "system": "http:/example.org/fhir/ids",
            "value": "456456"
          }
        ],
        "active": true,
        "name": [
          {
            "use": "official",
            "family": "Chalmers",
            "given": [
              "Peter",
              "James"
            ]
          }
        ],
        "gender": "male",
        "birthDate": "1974-12-25"
      },
      "request": {
        "method": "PUT",
        "url": "Patient?identifier=http:/example.org/fhir/ids|456456"
      }
    },
    {
      "fullUrl": "http://example.org/fhir/Patient/123a",
      "resource": {
        "resourceType": "Patient",
        "id": "123a",
        "text": {
          "status": "generated",
          "div": "<div xmlns=\\"http://www.w3.org/1999/xhtml\\">Some narrative</div>"
        },
        "active": true,
        "name": [
          {
            "use": "official",
            "family": "Chalmers",
            "given": [
              "Peter",
              "James"
            ]
          }
        ],
        "gender": "male",
        "birthDate": "1974-12-25"
      },
      "request": {
        "method": "PUT",
        "url": "Patient/123a",
        "ifMatch": "W/\\"2\\""
      }
    },
    {
      "request": {
        "method": "DELETE",
        "url": "Patient/234"
      }
    },
    {
      "request": {
        "method": "DELETE",
        "url": "Patient?identifier=123456"
      }
    },
    {
      "fullUrl": "urn:uuid:79378cb8-8f58-48e8-a5e8-60ac2755b674",
      "resource": {
        "resourceType": "Parameters",
        "parameter": [
          {
            "name": "coding",
            "valueCoding": {
              "system": "http://loinc.org",
              "code": "1963-8"
            }
          }
        ]
      },
      "request": {
        "method": "POST",
        "url": "ValueSet/$lookup"
      }
    },
    {
      "request": {
        "method": "GET",
        "url": "Patient?name=peter"
      }
    },
    {
      "request": {
        "method": "GET",
        "url": "Patient/12334",
        "ifNoneMatch": "W/\\"4\\"",
        "ifModifiedSince": "2015-08-31T08:14:33+10:00"
      }
    }
  ]
}`}];var ie=null;function Ye(){return ie||(ie=import("./chunk-6VX6PXDT.js")),ie}function en(e,r){let t=String(e&&e.message||e),i=t.match(/Unrecognized function: (\S+)/);if(i)return`Die Funktion "${i[1]}" kennt die Bibliothek nicht. Pr\xFCfen Sie die Schreibweise (FHIRPath unterscheidet Gro\xDF- und Kleinschreibung).`;let l=t.match(/Expected (\d+) arguments?/i);if(l)return`Die Funktion wurde mit der falschen Anzahl Argumente aufgerufen (erwartet: ${l[1]}). Pr\xFCfen Sie die Klammern der Funktion.`;if(/Cant consume unknown more tokens|Cannot consume unknown more tokens/i.test(t))return"Der Ausdruck ist unvollst\xE4ndig oder enth\xE4lt Zeichen, die FHIRPath nicht kennt. Pr\xFCfen Sie Klammern, Anf\xFChrungszeichen (einfache: 'text') und Operatoren.";let n=t.match(/Parse error at "([^"]*)" \(line (\d+), column (\d+)\)/);if(n)return`Syntaxfehler bei "${n[1]}" (Zeichen ${n[3]}): An dieser Stelle fehlt ein Ausdruck, oder ein Zeichen steht doppelt.`;if(/expected `\)`|expected `\]`/i.test(t))return"Eine schlie\xDFende Klammer fehlt.";if(/Invalid DateTime literal/i.test(t))return"Ung\xFCltiges Datums-Literal. Datum und Zeit beginnen mit @, zum Beispiel @1980-01-01.";if(/reading 'eval'/i.test(t))return"Diese Funktion wird von der eingebauten FHIRPath-Bibliothek nicht unterst\xFCtzt.";if(/Expected singleton, but found/i.test(t)){let o=(t.match(/"path"/g)||[]).length;return`Ein Operand ist eine Liste${o?" mit "+o+" Elementen":""}, erwartet wird ein einzelner Wert. W\xE4hlen Sie mit first(), [0] oder where(\u2026) ein Element aus.`}return/Unexpected end|Parse error|Expected|Unexpected token|Unknown token|Not implemented|not implemented/i.test(t)?"Der Ausdruck konnte nicht gelesen werden. Pr\xFCfen Sie Klammern, Anf\xFChrungszeichen (in FHIRPath einfache: 'text') und Funktionsnamen. Meldung der Bibliothek: "+t:"Auswertung fehlgeschlagen. Meldung der Bibliothek: "+t}function nn(e){return e===null?"null":Array.isArray(e)?"Liste":typeof e=="object"?e.resourceType?e.resourceType:"Objekt":typeof e=="number"?Number.isInteger(e)?"Zahl (ganz)":"Zahl":typeof e=="boolean"?"Boolean":"Text"}async function Pe(e,r){let t=String(e??"").trim();if(!t)return{ok:!1,error:"Bitte geben Sie einen FHIRPath-Ausdruck ein, zum Beispiel Patient.name.family."};if(t.length>2e3)return{ok:!1,error:"Der Ausdruck ist l\xE4nger als 2000 Zeichen."};let i;try{i=await Ye()}catch(l){return{ok:!1,error:"Die FHIRPath-Bibliothek konnte nicht geladen werden: "+String(l.message||l)}}try{return{ok:!0,results:i.evalFhirPath(t,r).map(n=>({value:n,type:nn(n)}))}}catch(l){return{ok:!1,error:en(l,t)}}}var M=(e,r=document)=>r.querySelector(e),s=(e,r,t)=>{let i=document.createElement(e);return r&&(i.className=r),t!==void 0&&(i.textContent=t),i},se=20*1024*1024,q=200,Ae=M("[data-viewer]");Ae&&tn(Ae);function tn(e){let r=M("#fv-input",e),t=M("#fv-status",e),i=M("#fv-out",e),l=M("#fv-file",e),n={model:null,format:null,sel:0,stack:[],tab:e.dataset.tab||"karte",filter:"",typeFilter:null,shown:q,fp:{scope:"sel",expr:""}},o=()=>v();function f(a,d={}){if(t.replaceChildren(),t.className="status",i.hidden=!0,i.replaceChildren(),a.length>se)return c({message:"Die Eingabe ist gr\xF6\xDFer als 20 MB.",hint:"F\xFCr so gro\xDFe Dateien ist der Browser-Viewer nicht gedacht. K\xFCrzen Sie die Datei oder nutzen Sie ein Kommandozeilenwerkzeug."});let u=pe(a);if(!u.ok)return c(u.error,a,d);n.format=u.format,n.model=Ee(u.resource),n.hints=(u.notes||[]).concat(ke(n.model)),n.versionNote=Te(n.model),n.sel=0,n.stack=[],n.filter="",n.typeFilter=null,n.shown=q,v()}function c(a,d,u={}){if(n.model=null,t.className="status error",t.setAttribute("role","alert"),t.append(s("strong","","Eingabe konnte nicht gelesen werden"),s("p","",a.message)),a.hint&&t.append(s("p","hint",a.hint)),a.line&&d){let y=d.split(`
`),b=Math.max(1,a.line-1),g=Math.min(y.length,a.line+1),m=s("pre","excerpt");for(let p=b;p<=g;p++){let h=y[p-1].length>160?y[p-1].slice(0,160)+"\u2026":y[p-1];m.append(s("span",p===a.line?"ln bad":"ln",String(p).padStart(4)+"  "+h+`
`)),p===a.line&&a.column&&m.append(s("span","ln caret"," ".repeat(6+Math.min(a.column-1,160))+`^
`))}if(t.append(m),u.focus){let p=0;for(let h=0;h<a.line-1;h++)p+=y[h].length+1;p+=Math.max(0,(a.column||1)-1),r.focus();try{r.setSelectionRange(p,Math.min(p+1,r.value.length))}catch{}}}}function v(){let a=n.model;if(!a)return;i.hidden=!1,i.replaceChildren(),t.replaceChildren(),t.className="status";let d=a.resource.resourceType||"(ohne resourceType)",u=s("div","summary"),y=(S,R)=>u.append(s("span","chip"+(R?" "+R:""),S));y(n.format==="xml"?"XML (in JSON-Struktur umgewandelt)":"JSON"),y(d),a.isBundle&&(y(`${a.entries.length} Eintr\xE4ge`),a.resource.type&&y("type: "+a.resource.type));let b=n.hints.filter(S=>S.level==="error").length,g=n.hints.filter(S=>S.level==="warn").length,m=n.hints.filter(S=>S.level==="info").length;y(b+g===0?"keine Auff\xE4lligkeiten gefunden":`${b} Fehler, ${g} Warnungen`,b?"bad":g?"warn":"ok"),i.append(u),t.setAttribute("role","status");let p=s("details","hints");b+g>0&&(p.open=!0),p.append(s("summary","",`Plausibilit\xE4tshinweise (${n.hints.length}${m?", davon "+m+" Info":""})`)),n.hints.length||p.append(s("p","muted","Keine Hinweise. Das hei\xDFt nur: die hier gepr\xFCften Regeln sind erf\xFCllt. Es ist keine Validierung gegen Profile oder Terminologien."));let h=s("ul","hint-list");for(let S of n.hints.slice(0,300)){let R=s("li","h-"+S.level);if(R.append(s("span","lvl",S.level==="error"?"Fehler":S.level==="warn"?"Warnung":"Info")),S.entry!==void 0){let A=s("button","linkish",S.where);A.type="button",A.addEventListener("click",()=>$(S.entry)),R.append(A)}else R.append(s("strong","",S.where));R.append(s("span",""," \u2013 "+S.msg)),h.append(R)}n.hints.length>300&&h.append(s("li","muted",`\u2026 und ${n.hints.length-300} weitere.`)),p.append(h),n.versionNote.length&&p.append(s("p","note","Hinweis zur Version: Die Eingabe enth\xE4lt Formen, die auf R5 hindeuten ("+n.versionNote.join("; ")+"). Der Viewer liest sie, die Hinweise und Pflichtfeld-Pr\xFCfungen gehen aber von R4 aus.")),i.append(p),a.isBundle&&i.append(T());let P=s("div","detail");P.id="fv-detail",i.append(P),N(P)}function T(){let a=n.model,d=s("section","bundle");d.append(s("h3","","Bundle-\xDCbersicht"));let u=s("div","types"),y=s("button","chip btn-chip"+(n.typeFilter===null?" on":""),`alle (${a.entries.length})`);y.type="button",y.addEventListener("click",()=>{n.typeFilter=null,n.shown=q,x()}),u.append(y);for(let[p,h]of[...a.typeCounts.entries()].sort((P,S)=>S[1]-P[1])){let P=s("button","chip btn-chip"+(n.typeFilter===p?" on":""),`${p} (${h})`);P.type="button",P.dataset.type=p,P.addEventListener("click",()=>{n.typeFilter=n.typeFilter===p?null:p,n.shown=q,x()}),u.append(P)}d.append(u);let b=s("input");b.type="search",b.placeholder="Eintr\xE4ge filtern (Typ, id, Text, fullUrl)",b.setAttribute("aria-label","Eintr\xE4ge filtern"),b.value=n.filter,b.id="fv-entry-filter",b.addEventListener("input",()=>{n.filter=b.value,n.shown=q,x()}),d.append(b);let g=s("ul","entries");g.id="fv-entries",d.append(g);let m=s("button","btn","Weitere Eintr\xE4ge anzeigen");return m.type="button",m.id="fv-more",m.hidden=!0,m.addEventListener("click",()=>{n.shown+=q,x()}),d.append(m),queueMicrotask(x),d}function x(){let a=n.model,d=M("#fv-entries");if(!d)return;let u=n.filter.trim().toLowerCase(),y=a.entries.filter(m=>(n.typeFilter===null||m.typeKey===n.typeFilter)&&(!u||[m.typeKey,m.id,m.label,m.fullUrl].filter(Boolean).join(" ").toLowerCase().includes(u)));d.replaceChildren();for(let m of y.slice(0,n.shown)){let p=s("li"),h=s("button","entry"+(m.index===n.sel?" sel":""));h.type="button",h.dataset.index=m.index,h.append(s("span","no",String(m.index+1)),s("span","badge",m.typeKey),s("span","lbl",m.label||m.fullUrl||""));let P=m.refs.filter(R=>R.status==="unresolved"||R.status==="ambiguous").length,S=m.refs.filter(R=>R.status==="resolved"||R.status==="contained").length;m.refs.length&&h.append(s("span","refcount"+(P?" bad":""),`${S}/${m.refs.length} Ref.`)),h.addEventListener("click",()=>$(m.index)),p.append(h),d.append(p)}y.length||d.append(s("li","muted","Kein Eintrag passt zum Filter."));let b=M("#fv-more");b&&(b.hidden=y.length<=n.shown,b.textContent=`Weitere Eintr\xE4ge anzeigen (${y.length-n.shown} \xFCbrig)`),document.querySelectorAll("#fv-out .types .btn-chip").forEach(m=>m.classList.toggle("on",m.dataset.type?m.dataset.type===n.typeFilter:n.typeFilter===null))}function $(a,d){d&&n.stack.push(n.sel),n.sel=a;let u=M("#fv-detail");u&&(N(u),u.scrollIntoView({block:"nearest",behavior:"smooth"})),document.querySelectorAll("#fv-entries .entry").forEach(y=>y.classList.toggle("sel",+y.dataset.index===a))}function N(a){let d=n.model,u=d.entries[n.sel];a.replaceChildren();let y=s("div","d-head"),b=s("h3","",u.resource?`${u.resourceType||"?"}${u.id?"/"+u.id:""}`:`Eintrag ${u.index+1}`);y.append(b);let g=s("div","d-actions");if(n.stack.length){let w=s("button","btn","\u2190 Zur\xFCck");w.type="button",w.id="fv-back",w.addEventListener("click",()=>{let B=n.stack.pop();n.sel=B,N(a),document.querySelectorAll("#fv-entries .entry").forEach(k=>k.classList.toggle("sel",+k.dataset.index===B))}),g.append(w)}let m=u.resource||u.raw,p=s("button","btn","Als JSON speichern");p.type="button",p.id="fv-download",p.addEventListener("click",()=>ae(m,(u.resourceType||"eintrag")+(u.id?"-"+u.id:"")+".json"));let h=s("button","btn","Kopieren");if(h.type="button",h.id="fv-copy",h.addEventListener("click",()=>De(JSON.stringify(m,null,2),h)),g.append(p,h),d.isBundle){let w=s("button","btn","Ganzes Bundle speichern");w.type="button",w.addEventListener("click",()=>ae(d.resource,"bundle"+(d.resource.id?"-"+d.resource.id:"")+".json")),g.append(w)}y.append(g),a.append(y),d.isBundle&&u.fullUrl&&a.append(s("p","muted small","fullUrl: "+u.fullUrl)),n.format==="xml"&&a.append(s("p","muted small","Die Anzeige beruht auf einer Umwandlung des XML in die JSON-Struktur; der Download ist JSON. Ohne Schema erkennt der Viewer Listen nur, wenn ein Element mehrfach vorkommt."));let P=s("div","tabs");P.setAttribute("role","tablist");let S={},R=[["karte","Karte"],["baum","Baum"],["fhirpath","FHIRPath"]];for(let[w,B]of R){let k=s("button","tab"+(n.tab===w?" on":""),B);k.type="button",k.setAttribute("role","tab"),k.setAttribute("aria-selected",String(n.tab===w)),k.dataset.tab=w,k.addEventListener("click",()=>{n.tab=w;for(let C of P.children)C.classList.toggle("on",C.dataset.tab===w),C.setAttribute("aria-selected",String(C.dataset.tab===w));for(let C in S)S[C].hidden=C!==w;E(w)}),P.append(k);let O=s("div","panel");O.id="fv-panel-"+w,O.setAttribute("role","tabpanel"),O.hidden=n.tab!==w,S[w]=O}a.append(P,S.karte,S.baum,S.fhirpath);let A={};function E(w){A[w]||(A[w]=!0,w==="karte"&&Be(S.karte,u),w==="baum"&&Oe(S.baum,u),w==="fhirpath"&&Ce(S.fhirpath,u))}E(n.tab)}function oe(a,d,u){if(u&&(u.status==="resolved"||u.status==="contained")&&u.index!==void 0&&(u.status==="resolved"||n.model.isBundle)){if(u.status==="contained")return s("span","ref ok",`${a.reference} (contained)`);let b=s("button","ref ok",`${a.display?a.display+" \xB7 ":""}${a.reference||"per Identifier"} \u2192 Eintrag ${u.index+1}`);return b.type="button",b.dataset.ref=u.index,b.title=u.method==="typ-id"?"Nur \xFCber Typ und id gefunden, nicht \xFCber die fullUrl":"Zum referenzierten Eintrag springen",b.addEventListener("click",()=>$(u.index,!0)),b}if(u&&u.status==="ambiguous")return s("span","ref bad",`${a.reference||"Identifier"} (mehrdeutig)`);if(u&&u.status==="unresolved")return s("span","ref bad",`${a.reference||"per Identifier"} (${u.reason||"nicht aufl\xF6sbar"})`);let y=s("span","ref",`${a.display?a.display+" \xB7 ":""}${a.reference||"Identifier"}`);return n.model.isBundle||(y.title="Ohne Bundle und ohne Netzwerkzugriff nicht aufl\xF6sbar"),y}function _(a,d,u=0,y=""){let b=Y(a),g=s("span","val"),m=p=>d.entry.refs.find(h=>h.path===p);switch(b){case"primitive":return g.append(s("span",typeof a=="string"?"v-s":"v-n",String(a))),g;case"null":return g.append(s("span","muted","null")),g;case"CodeableConcept":{let p=ee(a);return g.append(s("span","",p.head||"(ohne Text)")),p.codes.length&&g.append(s("small","codes",p.codes.join(" \xB7 "))),g}case"Reference":return oe(a,d.entry,m(y));case"HumanName":return g.append(s("span","",W(a))),a.use&&g.append(s("small","codes",a.use)),g;case"Coding":{let p=D(a);return g.append(s("span","",p)),a.system&&g.append(s("small","codes",J(a.system)+(a.code?" "+a.code:""))),g}case"array":{let p=s("ul","vlist");return a.forEach((h,P)=>{let S=s("li");S.append(_(h,d,u,y+"["+P+"]")),p.append(S)}),p}case"object":{if(u>=3)return g.append(s("code","",JSON.stringify(a))),g;let p=s("dl","card-dl nested");for(let[h,P]of Object.entries(a)){if(h==="id"||h==="extension")continue;let S=s("dt","",h),R=s("dd");R.append(_(P,d,u+1,y?y+"."+h:h)),p.append(S,R)}return p}default:return g.append(s("span","",D(a))),b!=="object"&&g.append(s("small","codes",b)),g}}function Be(a,d){if(a.replaceChildren(),!d.resource){a.append(s("p","muted","Dieser Eintrag enth\xE4lt keine Ressource. Siehe Baum f\xFCr request/response."));return}let u=d.resource;if(!u.resourceType){a.append(s("p","muted","Ohne resourceType gibt es keine Karte. Nutzen Sie den Baum."));return}let y=s("div","card"),b=["Patient","Observation","Encounter","Condition","MedicationRequest","DiagnosticReport"].includes(u.resourceType);y.append(s("p","card-h",u.resourceType+(b?"":" (allgemeine Karte)")));let g=s("dl","card-dl");for(let m of Re(u)){g.append(s("dt","",m.label));let p=s("dd");p.append(_(m.value,{entry:d},0,m.key)),g.append(p)}if(g.children.length||g.append(s("dt","","\u2013"),s("dd","muted","Keine Elemente au\xDFer id/meta/text.")),y.append(g),u.meta&&(u.meta.profile||u.meta.versionId||u.meta.lastUpdated)){let m=s("p","muted small");m.textContent="meta: "+[u.meta.versionId?"versionId "+u.meta.versionId:"",u.meta.lastUpdated?"lastUpdated "+u.meta.lastUpdated:"",u.meta.profile?"profile "+[].concat(u.meta.profile).join(", "):""].filter(Boolean).join(" \xB7 "),y.append(m)}if(typeof u.text?.div=="string"){let m=s("details","narr");m.append(s("summary","","Narrativ (text.div, nur als Text)"));let p=document.createElement("textarea");p.innerHTML=u.text.div.replace(/<[^>]*>/g," "),m.append(s("p","",p.value.replace(/\s+/g," ").trim())),y.append(m)}if(d.incoming&&d.incoming.length){let m=s("div","incoming");m.append(s("strong","","Referenziert von: "));let p=new Set;for(let h of d.incoming){if(p.has(h.from))continue;p.add(h.from);let P=n.model.entries[h.from],S=s("button","ref ok",`${P.typeKey} ${h.from+1}`);S.type="button",S.title=`${h.path}`,S.addEventListener("click",()=>$(h.from,!0)),m.append(S)}y.append(m)}if(a.append(y),d.refs.length){let m=s("details","reflist");m.append(s("summary","",`Referenzen dieser Ressource (${d.refs.length})`));let p=s("ul");for(let h of d.refs){let P=s("li");P.append(s("code","",h.path),document.createTextNode(" \u2192 ")),P.append(oe(h.ref?{reference:h.ref}:{reference:void 0},d,h)),h.method&&P.append(s("small","codes"," "+({fullUrl:"fullUrl",versionId:"fullUrl + meta.versionId",identifier:"Identifier","typ-id":"nur Typ/id (nicht spezifikationskonform)",contained:"contained"}[h.method]||h.method))),p.append(P)}m.append(p),a.append(m)}}function Oe(a,d){a.replaceChildren();let u=d.resource||d.raw,y=s("div","tree-bar"),b=s("input");b.type="search",b.placeholder="Im Baum suchen (Name oder Wert)",b.setAttribute("aria-label","Im Baum suchen"),b.id="fv-tree-search";let g=s("button","btn","Alle aufklappen");g.type="button";let m=s("button","btn","Alle zuklappen");m.type="button",y.append(b,g,m),a.append(y);let p=s("p","muted small");p.setAttribute("aria-live","polite"),a.append(p);let h=s("div","tree");a.append(h);let P=new Map(d.refs.map(A=>[A.path,A])),S=0;function R(A,E,w,B){if(E!==null&&typeof E=="object"){let C=Array.isArray(E),I=s("details","t-node");B<2&&(I.open=!0);let X=s("summary");if(X.append(s("span","k",A),s("span","meta",C?`[${E.length}]`:`{${Object.keys(E).length}}`)),!C){let z=E.resourceType?E.resourceType:null;z&&X.append(s("span","badge",z))}if(I.dataset.text=A.toLowerCase(),I.append(X),++S>6e3)return I.append(s("div","muted small","\u2026 Baum gek\xFCrzt (zu viele Knoten). Nutzen Sie Karte oder FHIRPath.")),I;if(C)E.forEach((z,K)=>I.append(R(String(K),z,w+"["+K+"]",B+1)));else for(let[z,K]of Object.entries(E))I.append(R(z,K,w?w+"."+z:z,B+1));return I}let k=s("div","t-row");k.dataset.text=(A+" "+String(E)).toLowerCase(),k.append(s("span","k",A));let O=A==="reference"?P.get(w.replace(/\.reference$/,"")):null;if(O&&O.status==="resolved"&&O.index!==void 0){let C=s("button","ref ok",`${E} \u2192 Eintrag ${O.index+1}`);C.type="button",C.addEventListener("click",()=>$(O.index,!0)),k.append(C)}else k.append(s("span",typeof E=="string"?"v-s":typeof E=="number"?"v-n":"v-b",typeof E=="string"?JSON.stringify(E):String(E)));return O&&O.status==="unresolved"&&k.append(s("small","ref bad",O.reason||"nicht aufl\xF6sbar")),k}if(u&&typeof u=="object")for(let[A,E]of Object.entries(u))h.append(R(A,E,A,0));g.addEventListener("click",()=>h.querySelectorAll("details").forEach(A=>A.open=!0)),m.addEventListener("click",()=>h.querySelectorAll("details").forEach(A=>A.open=!1)),b.addEventListener("input",()=>{let A=b.value.trim().toLowerCase(),E=h.querySelectorAll(".t-row"),w=h.querySelectorAll("details");if(!A){E.forEach(k=>k.hidden=!1),w.forEach(k=>k.hidden=!1),p.textContent="";return}let B=0;E.forEach(k=>{let O=k.dataset.text.includes(A);k.hidden=!O,O&&B++});for(let k of[...w].reverse()){let O=k.dataset.text.includes(A),C=k.querySelector(".t-row:not([hidden]), details:not([hidden])");k.hidden=!(O||C),O&&(k.querySelectorAll(".t-row, details").forEach(I=>I.hidden=!1),B++),k.open=!0}p.textContent=B?`${B} Treffer`:"Keine Treffer."})}let L={Patient:["Patient.name.family","Patient.name.where(use='official').given.first()","Patient.telecom.where(system='phone').value","Patient.birthDate"],Observation:["Observation.code.coding.code","Observation.value.ofType(Quantity).value","Observation.component.value.ofType(Quantity).value","Observation.subject.reference"],Condition:["Condition.code.text","Condition.clinicalStatus.coding.code","Condition.onset"],Encounter:["Encounter.status","Encounter.class.code"],Bundle:["Bundle.entry.count()","Bundle.entry.resource.ofType(Patient).count()","Bundle.entry.resource.ofType(Observation).subject.reference","Bundle.entry.fullUrl"]};function Ce(a,d){a.replaceChildren();let u=n.model,y=s("div","fp-row"),b=s("label","","FHIRPath-Ausdruck");b.htmlFor="fv-fp-expr";let g=s("input","mono");g.type="text",g.id="fv-fp-expr",g.autocomplete="off",g.spellcheck=!1,g.setAttribute("autocapitalize","off"),g.value=n.fp.expr||(d.resourceType&&L[d.resourceType]?L[d.resourceType][0]:"");let m=s("button","btn primary","Auswerten");m.type="button",m.id="fv-fp-run",y.append(b,g,m),a.append(y);let p=n.fp.scope;if(u.isBundle){let E=s("select");E.id="fv-fp-scope",E.setAttribute("aria-label","Auswertungsbereich");let w=s("option","","Gew\xE4hlte Ressource");w.value="sel";let B=s("option","","Ganzes Bundle");B.value="bundle",E.append(w,B),E.value=p,E.addEventListener("change",()=>{p=n.fp.scope=E.value}),a.append(E)}let h=s("div","fp-ex"),P=u.isBundle&&p==="bundle"?L.Bundle:L[d.resourceType]||[],S=[...new Set([...d.resourceType&&L[d.resourceType]||[],...u.isBundle?L.Bundle:[]])];for(let E of S){let w=s("button","chip btn-chip",E);w.type="button",w.addEventListener("click",()=>{if(g.value=E,u.isBundle&&L.Bundle.includes(E)){p=n.fp.scope="bundle";let B=M("#fv-fp-scope");B&&(B.value="bundle")}else if(u.isBundle){p=n.fp.scope="sel";let B=M("#fv-fp-scope");B&&(B.value="sel")}A()}),h.append(w)}S.length&&a.append(s("p","muted small","Beispiel-Ausdr\xFCcke zum Anklicken:"),h);let R=s("div","fp-res");R.id="fv-fp-result",R.setAttribute("aria-live","polite"),a.append(R),a.append(s("p","muted small","Ausgewertet wird mit evalFhirPath aus @medplum/core (Apache-2.0), das beim ersten Auswerten nachgeladen wird. Abweichungen zu anderen FHIRPath-Implementierungen sind m\xF6glich. Der Tester pr\xFCft nicht, ob ein Pfad f\xFCr den Ressourcentyp g\xFCltig ist."));async function A(){n.fp.expr=g.value,R.replaceChildren(s("p","muted","Wird ausgewertet \u2026"));let E=u.isBundle&&p==="bundle"?u.resource:d.resource||null;if(!E){R.replaceChildren(s("p","status error","Dieser Eintrag enth\xE4lt keine Ressource."));return}let w=await Pe(g.value,E);if(R.replaceChildren(),!w.ok){let k=s("p","status error",w.error);k.setAttribute("role","alert"),R.append(k);return}R.append(s("p","fp-count",w.results.length===0?"Leere Menge (kein Ergebnis). Der Pfad existiert in dieser Ressource nicht, oder ein Filter hat nichts getroffen.":`${w.results.length} Ergebnis${w.results.length===1?"":"se"}`));let B=s("ol","fp-list");w.results.slice(0,200).forEach(k=>{let O=s("li");O.append(s("span","badge",k.type));let C=s("pre","",typeof k.value=="object"?JSON.stringify(k.value,null,2):JSON.stringify(k.value));O.append(C),B.append(O)}),w.results.length>200&&B.append(s("li","muted",`\u2026 ${w.results.length-200} weitere nicht angezeigt.`)),R.append(B)}m.addEventListener("click",A),g.addEventListener("keydown",E=>{E.key==="Enter"&&(E.preventDefault(),A())})}function ae(a,d){let u=new Blob([JSON.stringify(a,null,2)],{type:"application/fhir+json"}),y=URL.createObjectURL(u),b=document.createElement("a");b.href=y,b.download=d.replace(/[^\w.\-]+/g,"_"),document.body.append(b),b.click(),b.remove(),setTimeout(()=>URL.revokeObjectURL(y),2e3)}async function De(a,d){let u=d.textContent;try{await navigator.clipboard.writeText(a),d.textContent="Kopiert"}catch{d.textContent="Kopieren nicht m\xF6glich"}setTimeout(()=>d.textContent=u,1500)}function H(a){let d=re.find(y=>y.id===a);if(!d)return!1;r.value=d.json;let u=M("#fv-sample-note",e);return u&&(u.hidden=!1,u.replaceChildren(document.createTextNode(`Beispiel \u201E${d.title}\u201C aus der FHIR-Spezifikation R4 (CC0), ${d.removedSnomed?"um SNOMED-CT-Codierungen und das Narrativ gek\xFCrzt. ":"unver\xE4ndert bis auf die Formatierung. "}`),Object.assign(s("a","","Original ansehen"),{href:d.url,rel:"noopener"}))),f(d.json),!0}e.dataset.ready="1",M("#fv-show",e).addEventListener("click",()=>f(r.value,{focus:!0})),M("#fv-clear",e).addEventListener("click",()=>{r.value="",i.hidden=!0,i.replaceChildren(),t.replaceChildren(),t.className="status",n.model=null;let a=M("#fv-sample-note",e);a&&(a.hidden=!0),r.focus()}),r.addEventListener("paste",()=>setTimeout(()=>f(r.value),0)),r.addEventListener("keydown",a=>{(a.ctrlKey||a.metaKey)&&a.key==="Enter"&&(a.preventDefault(),f(r.value,{focus:!0}))}),l.addEventListener("change",async()=>{let a=l.files[0];if(a){if(a.size>se)return c({message:`Die Datei ist ${(a.size/1048576).toFixed(1)} MB gro\xDF (Grenze 20 MB).`});r.value=await a.text(),f(r.value),l.value=""}}),["dragover","drop"].forEach(a=>r.addEventListener(a,async d=>{if(d.preventDefault(),a==="drop"){let u=d.dataTransfer.files[0];if(u){if(u.size>se)return c({message:"Die Datei ist gr\xF6\xDFer als 20 MB."});r.value=await u.text(),f(r.value)}}})),document.querySelectorAll("[data-sample]").forEach(a=>a.addEventListener("click",()=>{H(a.dataset.sample);let d=M("#viewer");d&&d.scrollIntoView({behavior:"smooth",block:"start"})})),document.querySelectorAll("[data-fp-sample]").forEach(a=>a.addEventListener("click",()=>{if(!H(a.dataset.fpSample))return;n.tab="fhirpath",n.fp.expr=a.dataset.fpExpr||"",n.fp.scope=a.dataset.fpScope==="bundle"?"bundle":"sel",v();let d=M("#fv-fp-run",e);d&&d.click();let u=M("#viewer");u&&u.scrollIntoView({behavior:"smooth",block:"start"})}));let V=new URLSearchParams(location.search).get("beispiel");V&&re.some(a=>a.id===V)?H(V):e.dataset.default&&H(e.dataset.default)}
