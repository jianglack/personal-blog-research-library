---
title: "大语言模型的 Test-Time Compute"
date: 2026-05-28
lang: zh
description: "整理 test-time compute 的基本方法、收益和局限。"
tags: ["LLM", "推理"]
topics: ["llm-reasoning"]
series: ["llm-notes"]
draft: false
featured: true
---

## 摘要

Test-time compute 指的是在模型推理阶段投入更多计算，以换取更高质量输出的一类方法。

## 常见方法

- 采样更多候选答案。
- 在多个推理路径之间搜索。
- 使用验证器筛选或打分候选答案。

## 待观察的问题

- 额外计算什么时候开始不再带来明显收益？
- 推理质量应该如何衡量？
- 延迟、成本和可靠性之间应该如何取舍？
