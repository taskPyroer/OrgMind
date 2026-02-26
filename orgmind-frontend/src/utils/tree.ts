/**
 * 将平铺数组转换为树形结构
 * @param list 源数组
 * @param id 唯一ID字段
 * @param pid 父ID字段
 * @param children 子节点字段
 */
export const listToTree = (list: any[], id = 'id', pid = 'parent_id', children = 'children') => {
  const data = JSON.parse(JSON.stringify(list));
  const result: any[] = [];
  const map: any = {};
  
  if (!Array.isArray(data)) {
    return [];
  }

  data.forEach(item => {
    map[item[id]] = item;
  });

  data.forEach(item => {
    const parent = map[item[pid]];
    if (parent) {
      (parent[children] || (parent[children] = [])).push(item);
    } else {
      result.push(item);
    }
  });

  return result;
};
