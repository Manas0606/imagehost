const AUTH_BASE='https://ep-orange-snow-a6j71rhq.neonauth.us-west-2.aws.neon.tech/neondb/auth';
const APP_CALLBACK='https://manas0606.github.io/imagehost/';
const RESET_REDIRECT='https://manas0606.github.io/imagehost/reset.html';

type ApiResult={ok:boolean;data?:any;message?:string};

async function post(path:string,body:any):Promise<ApiResult>{
  const res=await fetch(`${AUTH_BASE}${path}`,{
    method:'POST',
    headers:{
      'Content-Type':'application/json',
      'Accept':'application/json',
    },
    body:JSON.stringify(body),
  });
  let data:any={};
  try{data=await res.json()}catch{}
  const message=data?.message||data?.error?.message||data?.error||`Authentication server returned ${res.status}.`;
  return {ok:res.ok,data,message:String(message)};
}

export async function registerAccount(name:string,email:string,password:string){
  const normalized=email.trim().toLowerCase();
  const r=await post('/sign-up/email',{
    name:name.trim(),
    email:normalized,
    password,
    callbackURL:APP_CALLBACK,
  });
  if(!r.ok){
    const msg=(r.message||'').toLowerCase();
    if(msg.includes('exist')||msg.includes('already')||msg.includes('registered')||r.data?.code==='USER_ALREADY_EXISTS'){
      throw new Error('This email is already registered. Please use Login or Forgot Password.');
    }
    throw new Error(r.message||'Unable to register right now.');
  }
  const user=r.data?.user||r.data?.data?.user||{name:name.trim(),email:normalized};
  return {name:user?.name||name.trim(),email:user?.email||normalized};
}

export async function loginAccount(email:string,password:string){
  const normalized=email.trim().toLowerCase();
  const r=await post('/sign-in/email',{
    email:normalized,
    password,
    callbackURL:APP_CALLBACK,
  });
  if(!r.ok)throw new Error('Email or password is incorrect, or the account is not available.');
  const user=r.data?.user||r.data?.data?.user||{};
  return {name:user?.name||'Jyotish G User',email:user?.email||normalized};
}

export async function requestRemotePasswordReset(email:string){
  const r=await post('/request-password-reset',{
    email:email.trim().toLowerCase(),
    redirectTo:RESET_REDIRECT,
  });
  if(!r.ok)throw new Error(r.message||'Could not start password recovery.');
  return true;
}

export async function finishRemotePasswordReset(token:string,newPassword:string){
  const r=await post('/reset-password',{token:token.trim(),newPassword});
  if(!r.ok)throw new Error(r.message||'Password reset failed. The token may be invalid or expired.');
  return true;
}
