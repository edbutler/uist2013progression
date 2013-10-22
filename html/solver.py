from __future__ import absolute_import, print_function, unicode_literals

import os
import sys
import inspect
import json
from subprocess import Popen, PIPE
import random
from collections import namedtuple

_localdir = os.path.abspath(os.path.dirname(inspect.getfile(inspect.currentframe())))
_aspdir = os.path.join(_localdir, '../asp')

Predicate = namedtuple("Predicate", ["name", "args"])

def _run_lg_clasp(cwd, subdir, inprog):
    command = 'bin/generate.sh'
    proc = Popen(command, cwd=cwd, shell=True, stdout=PIPE, stdin=PIPE)
    stdout, stderr = proc.communicate(inprog)
    return stdout

def _run_pg_clasp(cwd, inprog):
    command = """
    clingo - progression.lp -l | \
    clasp --heu=vsids --time-limit=5 --sign-def=3 --opt-hie=3 --opt-heu=3 --seed=%s
    """ % random.randrange(2000000)
    proc = Popen(command, shell=True, cwd=cwd, stdout=PIPE, stdin=PIPE)
    stdout, stderr = proc.communicate(inprog)
    return stdout

def _get_pg_output(asp_output):
    lines = asp_output.split("\n");
    answerLine = None

    # parse the solver output for the answer
    for i in range(0, len(lines)):
        line = lines[i].strip()
        # don't break, we want the last answer (since it's an optimization)
        if line.startswith("Answer"):
            answerLine = lines[i+1]

    # now 'answerLine' should either be None or the optimal list of facts
    if answerLine is not None:
        return answerLine.strip().split(" ")
    else:
        return None

def _run_analyze_clasp(cwd, subdir, inprog):
    command = 'bin/analyze.sh'
    proc = Popen(command, cwd=cwd, shell=True, stdout=PIPE, stdin=PIPE)
    stdout, stderr = proc.communicate(inprog)
    return stdout

def _is_satisfiable(result):
    if result.find("UNSATISFIABLE") >= 0:
        return False
    elif result.find("SATISFIABLE") >= 0:
        return True
    else:
        raise ValueError("invalid output string")

def parse_predicate(p):
    s = p.split("(", 1)
    name = s[0]
    args = s[1][:-1].split(",")
    return Predicate(name, args)

class Solver(object):
    def __init__(self, subdirectory):
        self.subdir = subdirectory

    def generate_progression(self, configstr):
        cwd = os.path.join(_aspdir)
        facts = _get_pg_output(_run_pg_clasp(cwd, configstr))
        return facts

    def generate_level(self, configstr):
        cwd = os.path.join(_aspdir)
        return json.dumps(json.loads(_run_lg_clasp(cwd, self.subdir, configstr))["level"])

    def analyze_level(self, configstr):
        """returns whether the given level is satisfiable.
            configstr should contain level/1 rules and whichever config/1 rules are to be tested.
        """
        cwd = os.path.join(_aspdir)
        return not _is_satisfiable(_run_analyze_clasp(cwd, self.subdir, configstr))

