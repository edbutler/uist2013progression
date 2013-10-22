#!/bin/bash
clingo - refraction/concept_config.lp refraction/tablegen.lp -t | \
clingo - refraction/rules.lp refraction/generate.lp refraction/concept_constraints.lp --reify | \
clingo - meta.lp metaD.lp -l | \
clasp -t 8 --configuration=handy --outf=1 --sign-def=3 --seed=$RANDOM --eq=-1 | \
grep -v ^% | \
grep -v ^ANSWER | \
clingo - refraction/levelfile.lp -q --asp09 | \
sed 's/^OUTPUT;//'
