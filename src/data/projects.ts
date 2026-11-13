/**
 * 项目清单。
 * 每一条都来自作者本人维护的仓库，描述取自仓库 README，不写未实现的能力。
 */
export interface Project {
  /** 展示名 */
  name: string;
  /** 一句话定位 */
  tagline: string;
  /** 两三句说明 */
  description: string;
  /** 仓库地址 */
  repo?: string;
  /** 文档或下载页；缺省时用 repo/releases */
  homepage?: string;
  /** 关键能力，短句 */
  features: string[];
  /** 技术标签 */
  tags: string[];
  /** 主要语言 */
  language?: string;
  /** 许可证 */
  license?: string;
  /** 支持平台 */
  platforms?: string[];
  /** 维护状态 */
  status: 'active' | 'maintained' | 'paused';
  /** 置顶 */
  featured?: boolean;
}

export const PROJECTS: Project[] = [
  {
    name: 'BatchHash',
    tagline: '全平台批量 Hash 校验、导出与比对的瑞士军刀',
    description:
      '一次扫描同时算出十几种校验和，报告可导出可回读，两份报告之间、报告与实时目录之间都能比对；需要的话还能把摘要直接刻进文件名。全部运算在本机完成，文件不出本地。',
    repo: 'https://github.com/SeekDeeply/BatchHash',
    homepage: 'https://github.com/SeekDeeply/BatchHash/releases/latest',
    features: [
      '44 种哈希算法单遍算完，大文件按块流式处理',
      'JSON / CSV / Markdown / TXT / md5sum / BSD 六种格式导出与回读',
      '报告对报告、报告对目录的流式比对，区分未完成与不稳定',
      '批量重命名先出计划再执行，写入 SQLite 日志，可跨会话撤销',
      '操作日志、主题色自定义、中英双语界面',
    ],
    tags: ['桌面工具', '哈希校验', '批量处理'],
    language: 'Rust',
    license: 'Apache-2.0',
    platforms: ['Windows', 'macOS', 'Linux', 'Android'],
    status: 'active',
    featured: true,
  },
];
