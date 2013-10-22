from __future__ import absolute_import, print_function, unicode_literals

import os
import sys
import json
import inspect
from subprocess import Popen, PIPE
import random
from collections import namedtuple

_localdir = os.path.abspath(os.path.dirname(inspect.getfile(inspect.currentframe())))
_aspdir = os.path.join(_localdir, '..')

Predicate = namedtuple("Predicate", ["name", "args"])

def run_subproc_with_stdin(cmd, stdin, do_show_stderr):
    cwd = os.path.join(_aspdir)
    stderr = None if do_show_stderr else PIPE
    proc = Popen(cmd, cwd=cwd, shell=True, stdout=PIPE, stdin=PIPE, stderr=stderr)
    stdout, stderr = proc.communicate(stdin)
    return stdout

# get the model from clasp output in outf2 format
def extract_model_from_outf2(stdout):
    x = json.loads(stdout)
    return x["Witnesses"][0]["Value"]

# get the model from clasp output in outf2 format
def is_satisfiable_from_outf2(stdout):
    x = json.loads(stdout)
    return x["Result"] == 'SATISFIABLE'

def parse_predicate(p):
    s = p.split("(", 1)
    name = s[0]
    args = s[1][:-1].split(",")
    return Predicate(name, args)

