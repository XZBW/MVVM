# MVVM

## Object.defineProperty

object.defineProperty()方法会直接在一个对象上定义一个新属性，或者修改一个对象的现有属性，这个方法执行完成后会返回修改后的这个对象。
**用法**
`bject.defineProperty(obj, prop, descriptor)`

- obj 要处理的目标对象
- prop 要定义或修改的属性的名称
- descriptor 将被定义或修改的属性描述符
  - value：该属性对应的值。可以是任何有效的 JavaScript 值（数值，对象，函数等）。（默认 undefined）
  - writable：该属性是否只读，（默认 false，只读）
  - configurable 是否通过 Object.defineProperty 修改属性，或删除属性（默认 false，不能删除）
  - enumerable 是否遍历对象的时候会忽略当前属性（默认 false，不能遍历）
  - get
  - set
    注意：数据描述符（value,writable）和存取描述符（get，set）不能同时存在

## 数据劫持

observe 函数实现了一个数据监听，当监听某个对象后，我们可以在用户读取或者设置属性值的时候做个拦截，做我们想做的事。
值得注意的是在 vue 的下一个版本中（vue3.0）将原来的 Object.defineProperty 改用 ES6 的 Proxy 来做数据劫持。

```
var data = {
  name: 'hunger',
  friends: [1, 2, 3]
}
observe(data)

console.log(data.name)
data.name = 'valley'
data.friends[0] = 4


function observe(data) {
  if(!data || typeof data !== 'object') return
  for(var key in data) {
    let val = data[key]     //注意点1：这里是 let 不是 var，想想为什么
    Object.defineProperty(data, key, {
      enumerable: true,
      configurable: true,
      get: function() {
        console.log(`get ${val}`)
        return val
      },
      set: function(newVal) {
        console.log(`changes happen: ${val} => ${newVal}`)
        val = newVal
      }
    })
    if(typeof val === 'object'){
      observe(val)
    }
  }
}
```

## 观察者模式

```
class Subject {
  constructor() {
    this.observers = []
  }
  addObserver(observer) {
    this.observers.push(observer)
  }
  removeObserver(observer) {
    var index = this.observers.indexOf(observer)
    if(index > -1){
      this.observers.splice(index, 1)
    }
  }
  notify() {
    this.observers.forEach(observer=> {
      observer.update()
    })
  }
}


class Observer{
  constructor() {
    this.update = function() {}
  }
}


let subject = new Subject()
let observer1 = new Observer()
observer1.update = function() {
  console.log('observer1 update')
}
subject.addObserver(observer1)

let observer2 = new Observer('valley')
observer2.update = function() {
  console.log('observer2 update')
}
subject.addObserver(observer2)

subject.notify()
```
