# 元表与元方法

先记录一下什么是metatable

我发现之前的理解都有偏差，<span style="color:#66FF66;">metatable本身其实和table是一体的，一个table 的元表和这个table本身就是一体的，元表就是这个table定义的一部分（而不是什么基类或者别的什么关系）</span>。

> 这里必须要注意的是，内存中相同的元表是共享的，这就是为啥需要元表这个概念，有一些公共的定义，比如 \__add, \__index等，应该是共享的

比如对于一个table A，我给A设置元方法可以，但是如果A当中读操作的时候，他不会去找A的\_\_index，而是会去找A的metatable 的\_\_index。也就是说，元方法只能在元表中使用。<span style="color:#66FF66;">更精准地说，一个table的元方法就是定义在它的元表里的，是用来**定义该 table 在特定操作下的行为**（比如相加、索引不存在的 Key 等）</span>

> 当你对一个 Table 进行操作（例如 `a + b`）时，Lua 虚拟机会执行以下步骤：
>
> 1. **第一步：检查元表** Lua 会看 `a` 身上有没有挂载元表（Metatable）。
>    - 如果没有：报错（attempt to perform arithmetic on a table value）。
>    - 如果有：进入第二步。
> 2. **第二步：查找元方法** Lua 去那个元表里找，有没有一个叫 `__add` 的 Key（这就是元方法）。
>    - 如果没有：继续报错。
>    - 如果有：取出这个 `__add` 对应的函数。
> 3. **第三步：执行** 调用这个函数，把 `a` 和 `b` 作为参数传进去，执行你自定义的逻辑。

在OOP当中，往往只会实现\_\_index，而不会去实现\_\_newIndex（仔细想一下，读取的时候，如果子类没有，就返回父类的，写入的时候直接在子类创建新的就可以了）

同时，是元方法才会递归查找，意思是查找\_\_index指向的表，然后再去往下一直查

```c++
// lvm.c 中的 luaV_finishget 函数简化逻辑
for (loop = 0; loop < MAXTAGLOOP; loop++) {
  // ... 获取元表中的 __index 元方法 'tm' ...
  tm = fasttm(L, hvalue(t)->metatable, TM_INDEX);

  if (notm(tm)) { // 如果没有 __index 元方法
    // ... 查找结束，返回 nil ...
  }

  if (ttisfunction(tm)) { // 如果 __index 是一个函数
    // ... 调用该函数，并返回其结果 ...
  }

  t = tm;  // <-- 核心步骤！如果 __index 是一个表
  // ... 在新的表 't' 上重新尝试原始的 get 操作 ...
  // 如果找到了，就返回；如果还没找到，循环会继续，
  // 检查这个新的表 't' 是否也有元表和 __index
}
```

而metatable是不会被继承的，比如B是A的原表，C是B的原表，那么C中的元方法是不会被A触发的

```c++
const TValue *luaT_gettmbyobj (lua_State *L, const TValue *o, TMS event) {
  Table *mt;
  switch (ttype(o)) {
    case LUA_TTABLE:
      mt = hvalue(o)->metatable; // 1. 直接获取对象o的元表
      break;
    // ... (其他类型的处理) ...
  }
  // 2. 如果元表mt存在，则直接在mt中查找元方法。
  //    如果找不到，就返回nil，不会继续查找mt的元表。
  return (mt ? luaH_Hgetshortstr(mt, G(L)->tmname[event]) : &G(L)->nilvalue);
}
```

而如果给A的元表中的metatable\_\_index设置为B，B的元表metatable\_\_index设置为C，就可以通过\_\_index的递归查下去

![image-20250610171300383](assets/image-20250610171300383.png)

对于构造函数，走的是\_\_call这一条路线



__index说的是，如果在table里找不到，就执行__index的行为，如果它指向的是一个方法，就调用这个方法，如果它指向的是一个table，那么就递归查找

__newindex说的是，当涉及到写操作的时候，如果当前table中没有这个key，并且如果定义了__newindex，那么就直接调用__newindex的行为。如果它指向的是一个方法，那就直接调用方法，如果是一个table，那就写入这个table

所以一般阻止大G表写入，就是重写大G表的__newindex为一个函数，让他直接报错

```lua
setmetatable(_G, {
    __newindex = function(t, k, v)
        -- 直接报错，或者打印警告
        error("禁止写入全局变量: " .. tostring(k), 2)
    end
})

-- 测试
a = 10 -- 报错！因为 'a' 不在 _G 中，触发了 __newindex
```

## RawSet和RawGet

`rawset` 可以在写入 Table 时**完全无视**元方法

rawGet也可以无视元方法



| **普通操作**    | **对应的元方法** | **对应的“强制/原始”操作 (无视元方法)** |
| --------------- | ---------------- | -------------------------------------- |
| `t[k]` (读)     | `__index`        | **`rawget(t, k)`**                     |
| `t[k] = v` (写) | `__newindex`     | **`rawset(t, k, v)`**                  |
| `#t` (长度)     | `__len`          | **`rawlen(t)`** (Lua 5.2+)             |
| `a == b` (相等) | `__eq`           | **`rawequal(a, b)`**                   |