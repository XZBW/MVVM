function observe(data) {
  if (!data || typeof data !== "object") return;
  for (var key in data) {
    let val = data[key];
    let subject = new Subject();
    Object.defineProperty(data, key, {
      enumerable: true,
      configurable: true,
      get: function() {
        console.log(`get ${key}: ${val}`);
        if (currentObserver) {
          console.log("has currentObserver");
          currentObserver.subscribeTo(subject);
        }
        return val;
      },
      set: function(newVal) {
        val = newVal;
        console.log("start notify...");
        subject.notify();
      }
    });
    if (typeof val === "object") {
      observe(val);
    }
  }
}

let id = 0;
let currentObserver = null;

class Subject {
  constructor() {
    this.id = id++;
    this.observers = [];
  }
  addObserver(observer) {
    this.observers.push(observer);
  }
  removeObserver(observer) {
    var index = this.observers.indexOf(observer);
    if (index > -1) {
      this.observers.splice(index, 1);
    }
  }
  notify() {
    this.observers.forEach(observer => {
      observer.update();
    });
  }
}

class Observer {
  constructor(vm, key, cb) {
    this.subjects = {};
    this.vm = vm;
    this.key = key;
    this.cb = cb;
    this.value = this.getValue();
  }
  update() {
    let oldVal = this.value;
    let value = this.getValue();
    if (value !== oldVal) {
      this.value = value;
      this.cb.bind(this.vm)(value, oldVal);
    }
  }
  subscribeTo(subject) {
    if (!this.subjects[subject.id]) {
      console.log("subscribeTo.. ", subject);
      subject.addObserver(this);
      this.subjects[subject.id] = subject;
    }
  }
  getValue() {
    currentObserver = this;
    let value = this.vm[this.key]; //等同于 this.vm.$data[this.key]
    currentObserver = null;
    return value;
  }
}

class Compile {
  constructor(vm) {
    this.vm = vm;
    this.node = vm.$el;
    this.compile();
  }
  compile() {
    this.traverse(this.node);
  }
  traverse(node) {
    if (node.nodeType === 1) {
      this.compileNode(node); //解析节点上的v-bind 属性
      node.childNodes.forEach(childNode => {
        this.traverse(childNode);
      });
    } else if (node.nodeType === 3) {
      //处理文本
      this.compileText(node);
    }
  }
  compileText(node) {
    let reg = /{{(.+?)}}/g;
    let match;
    console.log(node);
    while ((match = reg.exec(node.nodeValue))) {
      let raw = match[0];
      let key = match[1].trim();
      node.nodeValue = node.nodeValue.replace(raw, this.vm[key]);
      new Observer(this.vm, key, function(val, oldVal) {
        node.nodeValue = node.nodeValue.replace(oldVal, val);
      });
    }
  }

  //处理指令
  compileNode(node) {
    let attrs = [...node.attributes]; //类数组对象转换成数组，也可用其他方法
    attrs.forEach(attr => {
      //attr 是个对象，attr.name 是属性的名字如 v-model， attr.value 是对应的值，如 name
      if (this.isModelDirective(attr.name)) {
        this.bindModel(node, attr);
      } else if (this.isEventDirective(attr.name)) {
        this.bindEventHander(node, attr);
      }
    });
  }
  bindModel(node, attr) {
    let key = attr.value; //attr.value === 'name'
    node.value = this.vm[key];
    new Observer(this.vm, key, function(newVal) {
      node.value = newVal;
    });
    node.oninput = e => {
      this.vm[key] = e.target.value; //因为是箭头函数，所以这里的 this 是 compile 对象
    };
  }
  bindEventHander(node, attr) {
    //attr.name === 'v-on:click', attr.value === 'sayHi'
    let eventType = attr.name.substr(5); // click
    let methodName = attr.value;
    node.addEventListener(eventType, this.vm.$methods[methodName]);
  }

  //判断属性名是否是指令
  isModelDirective(attrName) {
    return attrName === "v-model";
  }

  isEventDirective(attrName) {
    return attrName.indexOf("v-on") === 0;
  }
}

class mvvm {
  constructor(opts) {
    this.init(opts);
    observe(this.$data);
    new Compile(this);
  }
  init(opts) {
    this.$el = document.querySelector(opts.el);
    this.$data = opts.data || {};
    this.$methods = opts.methods || {};

    //把$data 中的数据直接代理到当前 vm 对象
    for (let key in this.$data) {
      Object.defineProperty(this, key, {
        enumerable: true,
        configurable: true,
        get: () => {
          //这里用了箭头函数，所有里面的 this 就指代外面的 this 也就是 vm
          return this.$data[key];
        },
        set: newVal => {
          this.$data[key] = newVal;
        }
      });
    }

    //让 this.$methods 里面的函数中的 this，都指向当前的 this，也就是 vm
    for (let key in this.$methods) {
      this.$methods[key] = this.$methods[key].bind(this);
    }
  }
}
