#!/bin/bash
clingo - refraction/tablegen.lp refraction/rules.lp refraction/analyze.lp refraction/concept_analyze.lp refraction/concept_constraints.lp -l | \
clasp -t 8 --configuration=handy --outf=2 --sign-def=3 --seed=$RANDOM --eq=-1

