class EFO{
	constructor(a,b){
		this.set.all({formName:a,itemFrame:b});
		this.management.firstSet(this.item.names,this.$dom.elements);
	}

	// management => controll(required,validate)
	management={
		info:{
			//name:{param: required && validate => true, required: true or false or '', validate: true or false or ''}			
		},
		firstSet:function(names,$elements){
			names.forEach(name=>this.setInfo(name,'param',''));
			const requireds=[...new Set([...$elements].filter($ele=>$ele.hasAttribute('data-required')).map($ele=>$ele.name))];
			requireds.forEach(name=>this.setInfo(name,'required',false));
			this.permitSubmit();
		},
		setInfo:function(name,key,value){
			try{
				this.info[name][key]=value;
			}catch{
				this.info[name]={};
				this.setInfo(name,key,value);
			}
		},
		getInfo:function(name,key){
			return this.info[name][key];
		},
		changeParam:function(name){
			const param=this.branchParam(name);
			this.setParam(name,param);
		},
		branchParam:function(name){
			const req=this.hasValue(name,'required');
			const val=this.hasValue(name,'validate');
			if(val==='') return val;
			return (req&&val);
		},
		hasValue:function(name,key){
			const value=this.getInfo(name,key);
			if(value==='') return value;
			if(this.hasProp(name,key)&&!value) return false;
			return true;
		},
		hasProp:function(name,key){
			return this.info[name].hasOwnProperty(key);
		},
		setParam:function(name,param){
			this.info[name].param=param;
		},
		start:(item)=>{
			try{
				this.required.run(item);
				this.validate[item.name](item);
			}catch(e){
				//console.log(e);
			}
		},
		end:function(bool,obj){
			const name=obj.item.name;
			this.setInfo(name,obj.area,bool);
			this.changeParam(name);
			const fn=this.branchFn(name);
			this.output(fn,obj);
			this.permitSubmit();
		},
		branchFn:function(name){
			switch(this.info[name].param){
				case true:return 'check';
				case false:return 'error';
				default :return 'active';
			}
		},
		output:(fn,obj)=>{
			this.itemStyle[fn](obj.item);
			this.errorInput(obj);
		},
		permitSubmit:function(){
			const bool=this.isParams();
			this.toggleSubmit(bool);
		},
		isParams:function(){
			const isPar=Object.keys(this.info).map(name=>this.info[name].param).includes(false);
			const isReq=Object.keys(this.info).map(name=>this.info[name].required).includes(false);
			if(!isPar&&!isReq) return true;
		},
		toggleSubmit:(bool)=>{
			if(bool){this.$dom.confirm.removeAttribute('disabled')}
			else{this.$dom.confirm.setAttribute('disabled',false)}
		},
		branchInput:function(item){
			if(['checkbox','radio'].includes(item.type)) return this.checked(item);
			if(['image','button','submit','reset'].includes(item.type))return false;
			if(item.tagName==='SELECT') return this.select(item);
			return item.value;
		},
		checked:(item)=>{
			if(!item.checked) return false;
			return [...document.querySelectorAll(`[name="${item.name}"]`)].filter($ele=>$ele.checked).map($ele=>$ele.value);
		},
		select:(item)=>{
			return item.options[item.selectedIndex].value;
		},
	}

	required={
		run:function(item){
			if(!this.isRequired(item.name)) return;
			const bool=this.branch(item);
			const text=this.getText(bool);
			this.setInfo(item.name,bool);
			this.toMng(bool,item,text);
		},
		setInfo:(name,value)=>{
			this.management.setInfo(name,'required',value);
		},
		isRequired:(name)=>{
			return this.management.hasProp(name,'required');
		},
		// return param: true or false
		branch:function(item){
			if(['checkbox','radio'].includes(item.type)) return this.checked(item);
			if(['image','button','submit','reset'].includes(item.type))return false;
			if(item.tagName==='SELECT') return this.select(item);
			return item.value?true:false;
		},
		// branch => checked
		checked:(item)=>{
			return [...document.querySelectorAll(`[name="${item.name}"]`)].find($ele=>$ele.checked)?true:false;
		},
		// branch => select
		select:(item)=>{
			return !item.options[item.selectedIndex].hasAttribute('hidden');
		},
		getText:(bool)=>{
			return bool?'':'Please fill in the required items';
		},
		toMng:(bool,item,text)=>{
			this.management.end(bool,{area:'required',item:item,text:text});
		},
	}

	validate={
		run:function(item,reg,text){
			const bool=this.getBool(item,reg);
			if(bool!==false) text='';
			this.setInfo(item.name,bool);
			this.toMng(bool,item,text);
		},
		getBool:function(item,reg){
			if(!this.isRequired(item.name) && item.value==='') return '';
			return this.test(item.value,reg);
		},
		setInfo:(name,value)=>{
			this.management.setInfo(name,'validate',value);
		},
		isRequired:(name)=>{
			return this.management.hasProp(name,'required');
		},
		test:(str,reg)=>{
			str=this.toHalfWidth(str);
			return reg.test(str);
		},
		toMng:(bool,item,text)=>{
			this.management.end(bool,{area:'validate',item:item,text:text})
		},
		tel:function(item){
			const reg=new RegExp(/^[0-9]{10,}$/);
			this.run(item,reg,'Please enter 10 or more numbers');
		},
		email:function(item){
			const reg=new RegExp(/^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/);
			this.run(item,reg,'E-mail address is wrong');
		},
		comment:function(item){
			const reg=new RegExp(/^.{0,500}$/);
			this.run(item,reg,'You can fill in 500 characters');
		},
	}

	// style
	itemStyle={
		setBG:(item,rgba)=>item.style.background=`rgba(${rgba})`,
		default:function(item){this.setBG(item,'255,255,255,1')},
		active:function(item){this.setBG(item,'0,255,0,.1')},
		check:function(item){this.setBG(item,'0,0,255,.1')},
		error:function(item){this.setBG(item,'255,0,0,.1')},
	}

	// errorArea input
	errorInput=(obj)=>{
		const errorAreas=`${obj.area}ErrorAreas`;
		const $area=this.$dom[errorAreas][obj.item.name];
		$area.textContent=obj.text;
		if(obj.text){$area.classList.add('active')}
		else{$area.classList.remove('active')}
	}


	// 全角=>半角
	toHalfWidth=(str)=>{
		const reg = new RegExp(/[Ａ-Ｚａ-ｚ０-９]/g);
		if(!reg.test(str)) return str;
		return str.replace(reg,(s)=>{
			return String.fromCharCode(s.charCodeAt(0)-65248);
		});
	}

	// 頭文字=>大文字
	initialLarge=(str)=>{
		return str.charAt(0).toUpperCase() + str.slice(1);
	}

	// html escape
	htmlspecialchars=(str)=>{
		return (str + '').replace(/&/g,'&amp;')
						.replace(/"/g,'&quot;')
						.replace(/'/g,'&#039;')
						.replace(/</g,'&lt;')
						.replace(/>/g,'&gt;'); 
	}

	set={
		all:function(obj){
			const fns=Object.keys(this).filter(fn=>fn!=='all');
			fns.forEach(fn=>this[fn](obj));
		},
		dom:(obj)=>{
			this.$dom={};
			const $=this.$dom;
			$.form=document.forms[obj.formName];
			$.elements=$.form.elements;
			$.confirm=$.form.querySelector('input[type="button"]');
			$.modal=document.querySelector('.modal');
			$.bg=document.querySelector('.modal .bg');
			$.box=document.querySelector('.modal .box');
			$.content=document.querySelector('.modal .content');
			$.inner=document.forms.modal.querySelector('.inner');
			$.submit=document.forms.modal.querySelector('input[type="submit"]');
			$.itemFrames=document.querySelectorAll(obj.itemFrame);
		},
		item:()=>{
			this.item={};
			this.item.names=[...new Set([...this.$dom.elements].map($ele=>$ele.name).filter($ele=>$ele))];
		},
		errorArea:()=>{
			const $frames=this.$dom.itemFrames;
			const length=$frames.length;
			const names=this.item.names;
			for(let i=0;i<length;i++){
				$frames[i].innerHTML+=`
					<div class="errorArea validate-${names[i]}__error"></div>
					<div class="errorArea required-${names[i]}__error"></div>
				`;
			}
			this.$dom.validateErrorAreas={};
			this.$dom.requiredErrorAreas={};
			names.forEach(name=>{
				this.$dom.validateErrorAreas[name]=document.querySelector(`.validate-${name}__error`);
				this.$dom.requiredErrorAreas[name]=document.querySelector(`.required-${name}__error`);
			});
		},
		event:()=>{
			function set($array,events){
				$array.forEach($ele=>{
					events.forEach(ev=>$ele.addEventListener(ev.e,ev.f,ev.b));
				});
			}
			const itemEvents=[
				{e:'input',f:this.eventFn.input,b:false},
				{e:'focus',f:this.eventFn.focus,b:false},
				{e:'blur',f:this.eventFn.blur,b:false},
			];
			const $elements=[...this.$dom.elements].filter($ele=>$ele.name);
			set($elements,itemEvents);
			window.addEventListener('beforeunload',this.eventFn.blockAway,false);
			window.addEventListener('pageshow',this.eventFn.reset,false);

			this.$dom.bg.addEventListener('click',this.eventFn.bg,false);
			this.$dom.confirm.addEventListener('click',this.eventFn.confirm,false);
			this.$dom.submit.addEventListener('click',this.eventFn.submit,false);
		},
	}

	eventFn={
		input:(e)=>{
			this.management.start(e.target);
		},
		focus:(e)=>{
			if(this.management.info[e.target.name].param===false) return;
			this.itemStyle.active(e.target);
		},
		blur:(e)=>{
			const item=e.target;
			item.value=this.toHalfWidth(item.value);
			this.management.start(item);
			if(this.management.info[e.target.name].param!=='') return;
			if(!this.management.hasProp(e.target.name,'required') && e.target.value){
				this.itemStyle.check(e.target);
			}else{
				this.itemStyle.default(e.target);
			}
		},
		blockAway:(e)=>{
			e.returnValue='The data you are entering will be deleted';
		},
		bg:()=>{
			['modal','bg','box'].forEach(name=>this.$dom[name].classList.remove('active'),this);
		},
		confirm:(e)=>{
			if(e.target.hasAttribute('disabled')) return false;
			['modal','bg','box'].forEach(name=>this.$dom[name].classList.add('active'),this);
			// 各値をmanagement.info[name]にセット
			[...this.$dom.elements].forEach($ele=>{
				let value = this.management.branchInput($ele);
				if(value===false) return false;
				if(value==='') value='not input...';
				this.management.setInfo('confirm',$ele.name,this.htmlspecialchars(value));
			});
			// セットした内容を反映
			this.$dom.inner.innerHTML='';
			this.item.names.forEach(name=>{
				this.$dom.inner.innerHTML+=`
					<div class="confirm">
						<input type="hidden" name="${name}" value="${this.management.info.confirm[name]}">
						<span class="confirm-item confirm-key">${this.initialLarge(name)}</span>
						<span class="confirm-item confirm-value">${this.management.info.confirm[name]}</span>
					</div>
				`;	
			});
		},
		submit:()=>{
			window.removeEventListener('beforeunload',this.eventFn.blockAway,false);
		},
		reset:()=>{
			this.$dom.form.reset();
		},
	}

}

const setForm = new EFO('form','dd');

