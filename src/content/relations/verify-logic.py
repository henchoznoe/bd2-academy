"""Deterministic checks for the hard FD/key/normal-form examples in these lessons."""
from itertools import combinations

def closure(x, dependencies):
    reached = set(x)
    while True:
        previous = reached.copy()
        for source, target in dependencies:
            if set(source) <= reached:
                reached.update(target)
        if previous == reached:
            return reached

def candidate_keys(attributes, dependencies):
    keys = []
    for size in range(len(attributes) + 1):
        for candidate in combinations(sorted(attributes), size):
            if any(set(key) <= set(candidate) for key in keys):
                continue
            if set(attributes) <= closure(candidate, dependencies):
                keys.append(candidate)
    return {frozenset(key) for key in keys}

def equivalent(left, right):
    return all(set(y) <= closure(x, right) for x, y in left) and all(set(y) <= closure(x, left) for x, y in right)

def minimal(dependencies):
    assert all(len(y) == 1 for x, y in dependencies)
    for index, (source, target) in enumerate(dependencies):
        assert not set(target) <= closure(source, dependencies[:index] + dependencies[index+1:]), (source,target,'redundant')
        for attribute in source:
            assert not set(target) <= closure(set(source)-{attribute}, dependencies), (source,target,attribute,'extraneous')

def third_normal_form(attributes, dependencies):
    keys = candidate_keys(attributes, dependencies)
    prime = set().union(*keys)
    for size in range(len(attributes) + 1):
        for source in combinations(sorted(attributes), size):
            reached = closure(source, dependencies) & set(attributes)
            if reached != set(attributes) and not (reached-set(source)) <= prime:
                return False
    return True

def plain(*pairs):
    return [(tuple(x), tuple(y)) for x,y in pairs]

f7=plain(('A','B'),('ABCD','E'),('EF','GH'),('ACDF','EG'))
g7=plain(('A','B'),('ACD','E'),('EF','G'),('EF','H'))
assert equivalent(f7,g7)
minimal(g7)
base=[(('B1','B2'),('A',)),(('D1','D2'),('B1','B2')),(('B1',),('C1',)),(('B2',),('C2',)),(('D1',),('A',)),(('D2',),('A',)),(('A','B1','C2'),('D2',)),(('A','B2','C1'),('D1',))]
attrs=set().union(*(set(x)|set(y) for x,y in base))
assert candidate_keys(attrs,base)=={frozenset(x) for x in [('B1','B2'),('D1','D2'),('B1','C2','D1'),('B2','C1','D2')]}
minimal([(x,(a,)) for x,y in base for a in y])
e1=[(('B1','B2'),('D1','D2'))]+base[1:]
assert equivalent(e1,base)
e1_min=[(('B1','B2'),('D1',))]+[(x,(a,)) for x,y in base[1:] for a in y]
assert equivalent(e1,e1_min)
minimal(e1_min)
relations=[('B1','B2','D1','D2'),('B1','C1'),('B2','C2'),('A','B1','C2','D2'),('A','B2','C1','D1')]
assert all(third_normal_form(r,base) for r in relations)
assert third_normal_form(('A','B1','B2'),base)
assert not third_normal_form(('A','B1','B2','D1','D2'),base)
f12=plain(('AB','C'),('B','D'),('B','E'),('BDL','K'),('BHJL','C'),('C','A'),('C','B'),('CEL','K'),('CIL','G'),('CIL','K'),('D','B'),('D','E'),('EIK','C'),('EIK','G'),('EIK','L'))
assert candidate_keys(set('ABCDEGHIJKL'),f12)=={frozenset('HIJ'+pair) for pair in ['BK','BL','CK','CL','DK','DL','EK']}
print('Verified DF-C07 minimal cover, DF-C09 four keys and irreducibility, DF-C12 seven keys, DF-C13 equivalence, FN-C07 projected 3NF and unsafe-fusion counterexample.')
