#!/usr/bin/python

from __future__ import absolute_import, print_function, unicode_literals

import sys
import json
import solver
import refraction
import argparse
from collections import defaultdict
from multiprocessing import Pool

def do_main(args):
    line = [l for l in sys.stdin][0]
    data = json.loads(line)
    rules = refraction.rules_from_level(data["level"])

    concepts = [
        'bending',
        'splitting',
        'adding',
        'wasting',
        'crossing',
        'blockers',
    ]

    for c in concepts:
        stdin = "config(%s).\n%s" % (c, rules)
        out = solver.run_subproc_with_stdin("./bin/analyze.sh", stdin, do_show_stderr=args.verbose)
        issatisfiable = solver.is_satisfiable_from_outf2(out)
        print("%s: %s" % (c, not issatisfiable))

if __name__ == "__main__":

    # BASE PARSERS
    ######################################################################

    parser = argparse.ArgumentParser(description='Analyze a level.')
    parser.add_argument('-v', '--verbose', dest='verbose', action='store_true', default=False, help="Verbose mode. Show stderr for ASP solver on stderr.")
    args = parser.parse_args()
    do_main(args)

