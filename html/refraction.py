
from __future__ import absolute_import, print_function, unicode_literals

import json
import solver
from concept import Struct
import concept

_concepts = concept.ConceptSet([
    concept.Concept("bending", "Bending"),
    concept.Concept("splitting", "Splitting"),
    concept.Concept("adding", "Adding"),
    concept.Concept("blockers", "Blockers"),
    concept.Concept("wasting", "Wasted Lasers"),
    concept.Concept("crossing", "Crossed Lasers"),
])

def _init_progcons():
    pc = concept.ProgressionConstraints(_concepts)
    c = pc.constraints
    c["general"] = {
        "num_levels": 25,
    }
    c["intensity"] = {
        "cdata":{
            "bending" : { "type":"mathematical" },
            "splitting" : { "type":"mathematical" },
            "adding" : { "type":"mathematical" },
            "blockers" : { "type":"mathematical" },
            "wasting" : { "type":"mathematical" },
            "crossing" : { "type":"mathematical" },
        },
        "types":[
            {
                "id":"mathematical",
                "name":"Mathematical",
                "curve":[
                    [0, 1],
                    [3, 1.7],
                    [8, 2],
                    [12,3.2],
                    [17,2.2],
                    [21,4.7],
                    [24,6],
                ],
            },
        ],
    }
    c["locked"] = {
    }
    c["newrate"] = [
        [0,  1],
        [1,  2],
        [5,  3],
        [17, 5],
        [24, 6],
    ]
    c["prerequisites"] = [
        {"post":"splitting",    "pre":"bending"},
        {"post":"blockers",     "pre":"bending"},
        {"post":"adding",       "pre":"splitting"},
        {"post":"wasting",      "pre":"splitting"},
        {"post":"crossing",     "pre":"splitting"},
        {"post":"crossing",     "pre":"blockers"},
    ]
    c["corequisites"] = [
        {"post":"wasting",      "pre":"splitting"},
        {"post":"crossing",     "pre":"bending"},
    ]

    default_intro = {
        "minintro":0,
        "maxintro":c["general"]["num_levels"] - 1,
        "dwell":0,
        "combo":3,
    }
    c["introduction"] = dict([(con.id, default_intro.copy()) for con in pc.cset.concepts])
    cintro = c["introduction"]
    cintro["bending"]["dwell"] = 1
    cintro["bending"]["maxintro"] = 0
    cintro["splitting"]["dwell"] = 2
    cintro["adding"]["dwell"] = 2

    return pc
_progcons = _init_progcons()

_test_level = json.loads("""
{"fver":1,"ltype":"normal","data":{"gver":1,"pieces":[{"type":"bender","pos":24,"mobility":"movable","repr":"fraction","input":"e","output":"s"},{"type":"source","pos":27,"repr":"fraction","output":"w","value":{"num":1,"den":1}},{"type":"target","pos":61,"repr":"fraction","inputs":["e"],"value":{"num":1,"den":2}},{"type":"splitter","pos":64,"mobility":"movable","repr":"fraction","input":"n","outputs":["e","w"]},{"type":"target","pos":67,"repr":"fraction","inputs":["w"],"value":{"num":1,"den":2}},{"type":"blocker","pos":88,"repr":"fraction"},{"type":"blocker","pos":89,"repr":"fraction"},{"type":"blocker","pos":98,"repr":"fraction"},{"type":"blocker","pos":99,"repr":"fraction"}]}}
""")

def rules_from_level(level):
    rules = []
    counter = 0

    dir_name = {
        "e" : "(0,lt)",
        "n" : "(1,gt)",
        "w" : "(0,gt)",
        "s" : "(1,lt)",
    }

    def add_rule(rule):
        rules.append("level(%s)." % rule)

    def make_bit_rules(axis, pce, value):
        # assumes refraction grids are 10x10 (thus 4 bits enough for encoding)
        for idx in [0,1,2,3]:
            bit = (value >> idx) & 1

            if bit == 1:
                add_rule("at_bit(%s,%s,%s)" % (axis, pce, idx))
            else:
                add_rule("not_at_bit(%s,%s,%s)" % (axis, pce, idx))

    for piece in level["data"]["pieces"]:
        pid = counter
        counter += 1

        if piece["type"] == "splitter":
            add_rule("type(%s,splitter%s)" % (pid, len(piece["outputs"])))
        else:
            add_rule("type(%s,%s)" % (pid, piece["type"]))

        x = piece["pos"] % 10
        y = piece["pos"] / 10
        add_rule("at_xy(%s,%s,%s)" % (pid, x, y))
        make_bit_rules(0, pid, x)
        make_bit_rules(1, pid, y)

        if "output" in piece:
            add_rule("port(%s,%s,out)" % (pid, dir_name[piece["output"]]))
        elif "outputs" in piece:
            [add_rule("port(%s,%s,out)" % (pid, dir_name[d])) for d in piece["outputs"]]

        if "input" in piece:
            add_rule("port(%s,%s,in)" % (pid, dir_name[piece["input"]]))
        elif "inputs" in piece:
            [add_rule("port(%s,%s,in)" % (pid, dir_name[d])) for d in piece["inputs"]]

        if "value" in piece:
            val = piece["value"]
            add_rule("%s_power(%s,(%s,%s))" % (piece["type"], pid, val["num"], val["den"]))

    return "\n".join(rules)

_args = {
    "id": "refraction",
    "jsincludes": ["app/refraction/app.js"],
    "jsapp": "saffron_app_refraction",
    "solver": solver.Solver("refraction"),
    "cset": _concepts,
    "pcon": _progcons,
    "default_level": _test_level,
    "rules_from_level": rules_from_level,
}
app = Struct(**_args)

