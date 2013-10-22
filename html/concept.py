from __future__ import absolute_import, print_function, unicode_literals

import json
from collections import namedtuple
import smath

class Struct(object):
    def __init__(self, **entries):
        self.__dict__.update(entries)

class Concept(object):
    def __init__(self, id, name, type="bool"):
        self.id = id
        self.name = name
        self.type = type

class ConceptSet(object):
    def __init__(self, concept_list):
        self.concept_list = concept_list
        self.id_to_concept = dict([(c.id, c) for c in concept_list])

    @property
    def concepts(self):
        return self.concept_list

    def jsonify(self):
        return [{"id":c.id, "name":c.name, "type":c.type} for c in self.concept_list]

    def from_id(self, cid):
        return self.id_to_concept[cid]

    def aspify(self, concept):
        return "config(%s)." % concept.id


class ProgressionConstraints(object):

    def __init__(self, cset):
        self.cset = cset
        self.constraints = {}

    @staticmethod
    def from_json(cset, obj):
        pcon = ProgressionConstraints(cset)
        pcon.constraints = obj
        return pcon

    def jsonify(self):
        return self.constraints

    def aspify(self):
        preds = ["concept(%s)." % c.id for c in self.cset.concepts]

        def procset(lst, predname):
            preds.extend(["%s(%s,%s)." % (predname, x["post"], x["pre"]) for x in lst])

        def locked(lid, cons):
            preds.append("locked(%s)." % lid)
            preds.extend(["contains(%s, %s)." % (lid, c) for c in cons.keys()])

        def splinevals(splinedata, predfmt, fudge):
            spline = smath.create_spline(splinedata)
            splinevals = [(x, int(round(smath.eval_spline(spline, x) + fudge))) for x in range(0,g["num_levels"])]
            preds.extend([predfmt % v for v in splinevals])

        def introvals(c, cons):
            preds.extend(["intro_%s(%s,%s)." % (name, c, val) for name, val in cons.items()])

        c = self.constraints
        g = c["general"]

        # general configs
        preds.extend(["config(%s,%s)." % (k,v) for k,v in g.items()])
        # *requisistes
        procset(c["prerequisites"], "prereq")
        procset(c["corequisites"], "coreq")
        # locked levels
        [locked(k, v) for k, v in c["locked"].items()]
        # intensity
        preds.extend(["concept_type(%s,%s)." % (k,v["type"]) for k,v in c["intensity"]["cdata"].items()])
        for ctype in c["intensity"]["types"]:
            splinevals(ctype["curve"], "intensity(%s,%%s,%%s)." % ctype["id"], 0)
        # newrate
        splinevals(c["newrate"], "cummulative_concepts(%s,%s).", -0.12)
        # intro
        [introvals(k,v) for k,v in c["introduction"].items()]

        config = "\n".join(preds)
        return config

class LevelProperties(object):

    def __init__(self):
        self.concepts = set()

    @staticmethod
    def from_json(cset, jsonobj):
        self = LevelProperties()
        self.concepts = set(k for k,v in jsonobj["concepts"].items())
        return self

    def jsonify(self):
        return { "concepts" : dict([(c, True) for c in self.concepts]) }

class Progression(object):

    Level = namedtuple("Level", ["concepts"])
    """
    Level:
        name : string, printable name
        concepts : string set, concept ids
    """

    @staticmethod
    def from_facts(cset, facts):
        """
            cset : ConceptSet
            strdata : string list, asp output
        """

        prog = Progression()
        prog.cset = cset

        # first count the total number of levels
        level_ids = [int(f.args[0]) for f in facts if f.name == 'level']
        prog.levels = [Progression.Level(set()) for i in level_ids]

        for f in [x for x in facts if x.name == 'contains']:
            level = int(f.args[0])
            cid = f.args[1]
            prog.levels[level].concepts.add(cid)

        return prog

    @staticmethod
    def from_json(cset, obj):
        """
            cset : ConceptSet
            strdata : string, json
        """
        prog = Progression()
        prog.cset = cset

        def create_level(levelj):
            concepts = set(k for k,v in levelj["concepts"].items())
            return Progression.Level(concepts)

        prog.levels = [create_level(l) for l in obj]

        return prog

    def jsonify(self):
        def level_to_json(level):
            return { "concepts" : dict([(c, True) for c in l.concepts]) }

        return [level_to_json(l) for l in self.levels]

    @property
    def concept_set(self):
        return self.cset

    @property
    def num_levels(self):
        return len(self.levels)

    def aspify_for_level(self, level_index):
        level = self.levels[level_index]
        return '\n'.join(['config(%s).' % c for c in level.concepts])

