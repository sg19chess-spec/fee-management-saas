"use strict";(()=>{var e={};e.id=82,e.ids=[82],e.modules={30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},13685:e=>{e.exports=require("http")},95687:e=>{e.exports=require("https")},85477:e=>{e.exports=require("punycode")},12781:e=>{e.exports=require("stream")},57310:e=>{e.exports=require("url")},59796:e=>{e.exports=require("zlib")},82923:(e,t,r)=>{r.r(t),r.d(t,{headerHooks:()=>h,originalPathname:()=>v,patchFetch:()=>Z,requestAsyncStorage:()=>_,routeModule:()=>m,serverHooks:()=>y,staticGenerationAsyncStorage:()=>g,staticGenerationBailout:()=>q});var a={};r.r(a),r.d(a,{GET:()=>c,POST:()=>f});var i=r(95419),s=r(69108),n=r(99678),o=r(78070),u=r(32409),l=r(65256);let d=(0,u.eI)("https://placeholder.supabase.co",process.env.SUPABASE_SERVICE_ROLE_KEY),p=l.Ry({name:l.Z_().min(1,"Plan name is required"),description:l.Z_().optional(),academic_year:l.Z_().min(1,"Academic year is required"),is_active:l.O7().default(!0),fee_items:l.IX(l.Ry({name:l.Z_().min(1,"Fee item name is required"),amount:l.Rx().positive("Amount must be positive"),fee_type:l.Km(["tuition","transport","library","laboratory","sports","other"]),due_date:l.Z_().optional(),is_optional:l.O7().default(!1)})).min(1,"At least one fee item is required"),institution_id:l.Z_().uuid("Valid institution ID is required")});async function c(e){try{let{searchParams:t}=new URL(e.url),r=t.get("institution_id"),a=parseInt(t.get("page")||"1"),i=parseInt(t.get("limit")||"10"),s=t.get("search")||"",n=t.get("academic_year")||"",u=t.get("status")||"";if(!r)return o.Z.json({error:"Institution ID is required"},{status:400});let l=(a-1)*i,p=d.from("fee_plans").select(`
        id,
        name,
        description,
        academic_year,
        is_active,
        created_at,
        updated_at,
        fee_items(
          id,
          name,
          amount,
          fee_type,
          due_date,
          is_optional
        )
      `,{count:"exact"}).eq("institution_id",r);s&&(p=p.or(`name.ilike.%${s}%,description.ilike.%${s}%`)),n&&(p=p.eq("academic_year",n)),u&&(p=p.eq("is_active","active"===u));let{data:c,error:f,count:m}=await p.order("created_at",{ascending:!1}).range(l,l+i-1);if(f)return console.error("Error fetching fee plans:",f),o.Z.json({error:"Failed to fetch fee plans"},{status:500});return o.Z.json({fee_plans:c||[],pagination:{page:a,limit:i,total:m||0,totalPages:Math.ceil((m||0)/i)}})}catch(e){return console.error("Error in GET /api/fee-plans:",e),o.Z.json({error:"Internal server error"},{status:500})}}async function f(e){try{let t=await e.json(),r=p.safeParse(t);if(!r.success)return o.Z.json({error:"Invalid request data",details:r.error.errors},{status:400});let{name:a,description:i,academic_year:s,is_active:n,fee_items:u,institution_id:l}=r.data,{data:c}=await d.from("fee_plans").select("id").eq("institution_id",l).eq("academic_year",s).eq("name",a).single();if(c)return o.Z.json({error:"Fee plan with this name already exists for the academic year"},{status:409});let{data:f,error:m}=await d.from("fee_plans").insert({institution_id:l,name:a,description:i,academic_year:s,is_active:n}).select().single();if(m)return console.error("Error creating fee plan:",m),o.Z.json({error:"Failed to create fee plan"},{status:500});let _=u.map(e=>({fee_plan_id:f.id,name:e.name,amount:e.amount,fee_type:e.fee_type,due_date:e.due_date,is_optional:e.is_optional})),{error:g}=await d.from("fee_items").insert(_);if(g)return console.error("Error creating fee items:",g),await d.from("fee_plans").delete().eq("id",f.id),o.Z.json({error:"Failed to create fee items"},{status:500});let{data:y,error:h}=await d.from("fee_plans").select(`
        id,
        name,
        description,
        academic_year,
        is_active,
        created_at,
        updated_at,
        fee_items(
          id,
          name,
          amount,
          fee_type,
          due_date,
          is_optional
        )
      `).eq("id",f.id).single();if(h)return console.error("Error fetching created fee plan:",h),o.Z.json({error:"Failed to fetch created fee plan"},{status:500});return o.Z.json({message:"Fee plan created successfully",fee_plan:y},{status:201})}catch(e){return console.error("Error in POST /api/fee-plans:",e),o.Z.json({error:"Internal server error"},{status:500})}}let m=new i.AppRouteRouteModule({definition:{kind:s.x.APP_ROUTE,page:"/api/fee-plans/route",pathname:"/api/fee-plans",filename:"route",bundlePath:"app/api/fee-plans/route"},resolvedPagePath:"C:\\Users\\sg13c\\fee-management-saas\\app\\api\\fee-plans\\route.ts",nextConfigOutput:"",userland:a}),{requestAsyncStorage:_,staticGenerationAsyncStorage:g,serverHooks:y,headerHooks:h,staticGenerationBailout:q}=m,v="/api/fee-plans/route";function Z(){return(0,n.patchFetch)({serverHooks:y,staticGenerationAsyncStorage:g})}}};var t=require("../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),a=t.X(0,[638,720,256],()=>r(82923));module.exports=a})();