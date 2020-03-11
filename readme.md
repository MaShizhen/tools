# mmstudio-tools

<!-- TOC -->

- [1. Description](#1-description)
- [3. 代码自动补全](#3-代码自动补全)
- [智能创建组件](#智能创建组件)
- [创建，引用原子操作](#创建引用原子操作)
- [创建，引用控件](#创建引用控件)

<!-- /TOC -->

## 1. Description

vscode, speedup developing

Required: **vscode版本必须是1.37以上才可以使用**

## 3. 代码自动补全

**snippets:**

| prefix | body |
| ------ | ------ |
| mma | data-mm-actions='click:a' |
| mmp | data-mm-props='' |
| mmt | data-mm-tpl='' |
| mmid | data-mm-id='' |
| mmimg | data-mm-src='' |
| mmas | `<!--  start -->` |
| mmae | `<!--  end -->` |
| mmi | `<img data-mm-src='' alt='' title='' src='' />` |

## 智能创建组件

页面(应用)由组件组成，`alt+c`自动创建组件，在组件中，快速创建tpl，响应，服务。

## 创建，引用原子操作

除公共原子操作外，开发人员可以自创建并引用原子操作

## 创建，引用控件

除公共原子操作外，开发人员可以自创建并引用控件。
