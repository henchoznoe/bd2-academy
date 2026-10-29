export type TreeNode = { keys: number[]; children: TreeNode[]; leaf: boolean };
const node = (leaf = true): TreeNode => ({ keys: [], children: [], leaf });
const clone = (tree: TreeNode): TreeNode => structuredClone(tree);
export class BTree {
  root = node();
  events: string[] = [];
  readonly order = 2;
  search(key: number) {
    const path: TreeNode[] = [];
    let current = this.root;
    for (;;) {
      path.push(current);
      let i = 0;
      while (i < current.keys.length && key > current.keys[i]) i++;
      if (current.keys[i] === key) return { found: true, path };
      if (current.leaf) return { found: false, path };
      current = current.children[i];
    }
  }
  insert(key: number) {
    this.events = [];
    if (!Number.isFinite(key) || this.search(key).found) {
      this.events.push("Clé déjà présente ou invalide : aucune insertion.");
      return;
    }
    const add = (
      current: TreeNode,
    ): { median: number; right: TreeNode } | undefined => {
      let i = 0;
      while (i < current.keys.length && key > current.keys[i]) i++;
      if (current.leaf) {
        current.keys.splice(i, 0, key);
        this.events.push(`Insérer ${key} dans une feuille.`);
      } else {
        const split = add(current.children[i]);
        if (split) {
          current.keys.splice(i, 0, split.median);
          current.children.splice(i + 1, 0, split.right);
        }
      }
      if (current.keys.length <= 2 * this.order) return;
      const median = current.keys[this.order],
        right = node(current.leaf);
      right.keys = current.keys.splice(this.order + 1);
      current.keys.splice(this.order);
      if (!current.leaf)
        right.children = current.children.splice(this.order + 1);
      this.events.push(
        `Débordement de 2d clés : ${median} monte ; d clés restent de chaque côté.`,
      );
      return { median, right };
    };
    const split = add(this.root);
    if (split) {
      const root = node(false);
      root.keys = [split.median];
      root.children = [this.root, split.right];
      this.root = root;
      this.events.push("Nouvelle racine : la hauteur augmente.");
    }
  }
  delete(key: number) {
    this.events = [];
    if (!this.search(key).found) {
      this.events.push("Clé absente : aucune suppression.");
      return;
    }
    const rebalance = (parent: TreeNode, index: number) => {
      const child = parent.children[index];
      if (child.keys.length >= this.order) return;
      const left = parent.children[index - 1],
        right = parent.children[index + 1];
      if (left && left.keys.length > this.order) {
        child.keys.unshift(parent.keys[index - 1]);
        parent.keys[index - 1] = left.keys.pop()!;
        if (!left.leaf) child.children.unshift(left.children.pop()!);
        this.events.push(
          "Redistribution depuis le frère gauche, via le parent.",
        );
      } else if (right && right.keys.length > this.order) {
        child.keys.push(parent.keys[index]);
        parent.keys[index] = right.keys.shift()!;
        if (!right.leaf) child.children.push(right.children.shift()!);
        this.events.push(
          "Redistribution depuis le frère droit, via le parent.",
        );
      } else {
        const mergeIndex = left ? index - 1 : index;
        const first = parent.children[mergeIndex],
          second = parent.children[mergeIndex + 1];
        first.keys.push(parent.keys.splice(mergeIndex, 1)[0], ...second.keys);
        first.children.push(...second.children);
        parent.children.splice(mergeIndex + 1, 1);
        this.events.push(
          "Fusion : frère, séparateur du parent et enfant déficitaire ; au plus 2d clés.",
        );
      }
    };
    const remove = (current: TreeNode, target: number) => {
      let i = 0;
      while (i < current.keys.length && target > current.keys[i]) i++;
      if (current.leaf) {
        if (current.keys[i] === target) current.keys.splice(i, 1);
        this.events.push(`Retirer ${target} de la feuille.`);
        return;
      }
      if (current.keys[i] === target) {
        let predecessor = current.children[i];
        while (!predecessor.leaf)
          predecessor = predecessor.children[predecessor.children.length - 1];
        const replacement = predecessor.keys[predecessor.keys.length - 1];
        current.keys[i] = replacement;
        this.events.push(
          `Remplacer ${target} par son prédécesseur ${replacement}.`,
        );
        remove(current.children[i], replacement);
      } else remove(current.children[i], target);
      rebalance(current, i);
    };
    remove(this.root, key);
    if (!this.root.leaf && !this.root.keys.length) {
      this.root = this.root.children[0];
      this.events.push("Racine vide : la hauteur diminue.");
    }
  }
  snapshot() {
    return clone(this.root);
  }
}
export class BPlusTree {
  root = node();
  events: string[] = [];
  private maximum(current: TreeNode): number {
    return current.leaf
      ? current.keys[current.keys.length - 1]
      : this.maximum(current.children[current.children.length - 1]);
  }
  private refresh(current: TreeNode) {
    if (!current.leaf)
      current.keys = current.children.slice(0, -1).map((c) => this.maximum(c));
  }
  search(key: number) {
    const path: TreeNode[] = [];
    let current = this.root;
    while (!current.leaf) {
      path.push(current);
      let i = 0;
      while (i < current.keys.length && key > current.keys[i]) i++;
      current = current.children[i];
    }
    path.push(current);
    return { found: current.keys.includes(key), path };
  }
  insert(key: number) {
    this.events = [];
    if (!Number.isFinite(key) || this.search(key).found) {
      this.events.push("Clé déjà présente ou invalide.");
      return;
    }
    const add = (current: TreeNode): TreeNode | undefined => {
      if (current.leaf) {
        current.keys.push(key);
        current.keys.sort((a, b) => a - b);
        this.events.push(`Insérer ${key} dans la feuille.`);
        if (current.keys.length <= 4) return;
        const right = node();
        right.keys = current.keys.splice(2);
        this.events.push(
          `Éclater la feuille et copier ${current.keys[current.keys.length - 1]} dans le répertoire.`,
        );
        return right;
      }
      let i = 0;
      while (i < current.keys.length && key > current.keys[i]) i++;
      const sibling = add(current.children[i]);
      if (sibling) current.children.splice(i + 1, 0, sibling);
      this.refresh(current);
      if (current.children.length <= 5) return;
      const right = node(false);
      right.children = current.children.splice(3);
      this.refresh(current);
      this.refresh(right);
      this.events.push(
        "Éclatement d’un nœud interne : répartir les pointeurs puis recalculer les séparateurs.",
      );
      return right;
    };
    const sibling = add(this.root);
    if (sibling) {
      const root = node(false);
      root.children = [this.root, sibling];
      this.refresh(root);
      this.root = root;
      this.events.push("Création d’une nouvelle racine.");
    }
  }
  delete(key: number) {
    this.events = [];
    if (!this.search(key).found) {
      this.events.push("Clé absente.");
      return;
    }
    const size = (n: TreeNode) => (n.leaf ? n.keys.length : n.children.length);
    const remove = (current: TreeNode) => {
      if (current.leaf) {
        current.keys.splice(current.keys.indexOf(key), 1);
        this.events.push(`Supprimer ${key} de la feuille.`);
        return;
      }
      let i = 0;
      while (i < current.keys.length && key > current.keys[i]) i++;
      const child = current.children[i];
      remove(child);
      if (size(child) < (child.leaf ? 2 : 3)) {
        const left = current.children[i - 1],
          right = current.children[i + 1];
        if (left && size(left) > (left.leaf ? 2 : 3)) {
          if (child.leaf) child.keys.unshift(left.keys.pop()!);
          else child.children.unshift(left.children.pop()!);
          this.refresh(left);
          this.refresh(child);
          this.events.push("Redistribution depuis le frère gauche.");
        } else if (right && size(right) > (right.leaf ? 2 : 3)) {
          if (child.leaf) child.keys.push(right.keys.shift()!);
          else child.children.push(right.children.shift()!);
          this.refresh(right);
          this.refresh(child);
          this.events.push("Redistribution depuis le frère droit.");
        } else {
          const destination = left ?? child,
            source = left ? child : right;
          if (destination.leaf) destination.keys.push(...source.keys);
          else destination.children.push(...source.children);
          this.refresh(destination);
          current.children.splice(left ? i : i + 1, 1);
          this.events.push(
            "Fusion avec un frère et mise à jour des séparateurs.",
          );
        }
      }
      this.refresh(current);
    };
    remove(this.root);
    if (!this.root.leaf && this.root.children.length === 1) {
      this.root = this.root.children[0];
      this.events.push("Réduction de la hauteur.");
    }
  }
  leaves(): number[][] {
    const visit = (n: TreeNode): number[][] =>
      n.leaf ? [n.keys] : n.children.flatMap(visit);
    return visit(this.root);
  }
  snapshot() {
    return clone(this.root);
  }
}
