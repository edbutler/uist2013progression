#!/usr/bin/python

from __future__ import absolute_import, print_function, unicode_literals

import sys
import json
import solver
import refraction
import argparse
from collections import defaultdict
from multiprocessing import Pool

concepts = [
    'bending',
    'splitting',
    'adding',
    'wasting',
    'crossing',
    'blockers',
]

def do_main(args):

    stdin = "\n".join(["config(%s)." % c for c in args.concepts])
    out = solver.run_subproc_with_stdin("./bin/generate.sh", stdin, do_show_stderr=args.verbose)
    print(out)

if __name__ == "__main__":

    # BASE PARSERS
    ######################################################################

    parser = argparse.ArgumentParser(description='Generate a level.')
    parser.add_argument('-v', '--verbose', dest='verbose', action='store_true', default=False, help="Verbose mode. Show stderr for ASP solver on stderr.")
    parser.add_argument('concepts', nargs='+', choices=concepts, help="Concepts to have in level")
    args = parser.parse_args()
    do_main(args)

