---
theme: default
title: linalg-checker
info:
class: text-center
drawings:
  persist: false
transition: slide-left
comark: true
---

# `linalg-checker`

Lightweight checking for undergraduate-level finite-dimensional linear algebra

---

## Clarifications wrt scope

- Clean-room implementation. No Leantutor IP used.
  - Corollary: There is overlap and divergence from our existing implementation.
- This is a prototype. Just because I worked on it doesn't mean I think we should use it.
  - Corollary: Divergence from our existing implementation should be fine. It is just experimentation.
  - LLMs have created a reversal: ideas are costly and code is cheap. Green-field prototypes make more sense than ever.

<!-- Happy to discuss copyright offline. -->

---

## Original motivation (perhaps naive)

- When people write proofs, they usually assert **universally quantified statements** $\forall n_1, n_2, \dots, x_1, x_2, \dots \,, \phi(n_1, n_2, \dots, x_1, x_2, \dots)$
- **Naively,** I said: "existentially quantified statements are easy to prove! **Just** fuzz and exhibit a witness like software testing folks do"
- Proving student-written claims true is an unsatisfactory solution on its own
  - It costs latency/$$$ to try to **prove falsehoods**

---

## Original motivation (continued)

- Problem 1: Witnesses involve real numbers?
  - Naive answer: Fuzz over $\mathbb Q$
  - Other answer: Fuzz over the closure of $\mathbb Q$ under $\sqrt \cdot$
- Problem 2: Hypotheses (e.g. equational constraints) will be satisfied w.p. 0?
  - Set of witnesses has measure 0?
  - Fuzzing only checks points

<img src="/cexes-points-cropped.png" alt="Candidate and actual counterexamples on a manifold" style="max-width: 70%; max-height: 40vh; height: auto; object-fit: contain; display: block; margin: 0 auto" />

<!-- todo: visualize points floating above/below lower-dimensional manifold -->

---

## Actual motivation

<!-- - Disproving is naturally expressed as deciding an **existentially quantified formula** $\exists x_1, x_2, \dots \, \neg\phi(x_1, x_2, \dots)$ -->
- Cost: **There will always be "easy" problems** for which symbolic/non-neural algorithms are **much** cheaper/more responsive than LLMs will likely ever be
  - At the undergrad level, **we are interested in "easy" problems**
    - maybe even decidable!
    - Or translatable or "closely" under/over-approximable by decidable problems
- Other reasons:
  - Feasibility: 100% correctness is usually not the most important goal in education
    - Partial support for inputs, ill-defined scope of support, under/overapproximation, etc. are all fair game.
  - Determinism: Tool use vs. prompt engineering can both increase determinism & alignment, and each has pros and cons

**What if our system based on SoTA tech is 10 years behind SoTA performance?**

---
layout: two-cols
class: proof-example
---

## Example (QF_NRA): Squaring nonnegative numbers is monotone

*Timing: 20.9 ms*

<!-- Source: linalg-checker/examples/validate_argument/successes.output.md — Squaring nonnegative numbers is monotone -->

Given:

- $x \in \mathbb{R}$
- $y \in \mathbb{R}$
- $0 \le x$
- $x \le y$

WTS $x^{2} \le y^{2}$

<details>
<summary>✅ verified</summary>

This follows from the following facts:

- $x^{2} \le y^{2}$
</details>

::right::

1. $0 \le y$

   <details>
   <summary>✅ verified</summary>

   This follows from the following facts:

   - $0 \le x$
   - $x \le y$
   </details>
2. $0 \le y - x$

   <details>
   <summary>✅ verified</summary>

   This follows from the following facts:

   - $x \le y$
   </details>
3. $0 \le \left(y - x\right) \left(x + y\right)$

   <details>
   <summary>✅ verified</summary>

   This follows from the following facts:

   - $0 \le x$
   - $x \le y$
   </details>
4. $0 \le y^{2} - x^{2}$

   <details>
   <summary>✅ verified</summary>

   This follows from the following facts:

   - $0 \le \left(y - x\right) \left(x + y\right)$
   </details>
5. $x^{2} \le y^{2}$

   <details>
   <summary>✅ verified</summary>

   This follows from the following facts:

   - $0 \le \left(y - x\right) \left(x + y\right)$
   </details>

---

## Types of guarantees

Solve the following problem:
- **Decide** linear algebra propositions with *bounded dimension* that can be expressed without quantifier alternation
  - i.e.: prove or disprove
- **Disprove** linear algebra propositions that can be expressed without quantifier alternation

---

## Related work, and why this may not already exist

- SMT-comp aggregates solvers that provide good support for many subsets of math
  - Including real arithmetic
  - Problem 1: "good support" implies limited scope
  - Problem 2: the most practically applicable theories (bitvectors, arrays, etc.) are more relevant to software/hardware than mathematics
  - Problem 3: these are infrastructure, not user interfaces, and hence lack high-level constructs
- CASes (magma, sympy, sagemath, ...) are well-established and widely used
  - APIs/syntax etc. designed before LLMs
  - Similar "good support" limitations

---
layout: two-cols
class: proof-example
---

## Example w/ dimensions: Orthogonal matrices preserve squared length

*Timing: 37.6 ms*

<!-- Source: linalg-checker/examples/validate_argument/successes.output.md — Orthogonal matrices preserve squared length -->

Given:

- $U \in \mathbb{R}^{n \times n}$
- $x \in \mathbb{R}^{n}$
- $U^\top U = I$

WTS $\left\lVert U x \right\rVert_{2}^{2} = \left\lVert x \right\rVert_{2}^{2}$

<details>
<summary>✅ likely</summary>

No counterexamples found up to a maximum dimension of 2.

This may follow from the following facts:

- $U^\top U = I$
- $x^\top U^\top U x = x^\top I x$
</details>

::right::

1. $\left(U x\right)^\top U x = x^\top U^\top U x$

   <details>
   <summary>✅ likely</summary>

   No counterexamples found up to a maximum dimension of 2.

   No premises seemed necessary to show this.
   </details>
2. $x^\top U^\top U x = x^\top I x$

   <details>
   <summary>✅ likely</summary>

   No counterexamples found up to a maximum dimension of 2.

   This may follow from the following facts:

   - $U^\top U = I$
   </details>
3. $x^\top I x = x^\top x$

   <details>
   <summary>✅ likely</summary>

   No counterexamples found up to a maximum dimension of 2.

   No premises seemed necessary to show this.
   </details>

---
layout: two-cols
class: proof-example
---

# Example w/ cex synthesis: One-sided orthogonality

*Timing: 28.1 ms*

<!-- Source: linalg-checker/tests/fixtures/validate_arguments_output.md — One-sided orthogonality -->

Given:

- $U^\top U = I$

WTS $U U^\top = I$

<details>
<summary>❌ counterexample found</summary>

The negation of $U U^\top = I$ is satisfied by:

- $U = \begin{bmatrix}0 \\ -1\end{bmatrix}$
</details>

---
layout: two-cols
class: proof-example
---

# Example: Formalizing input involving ellipsis

*Timing: 90.3 ms*

Non-neural program synth is a practical and mature field (see Solar-Lezama's SKETCH & many subsequent works, and many papers by Gulwani et al.), but domain-specific work on math-specific PBE/sketching might not exist.

<!-- Source: linalg-checker/tests/fixtures/validate_arguments_output.md — Ellipsis error localization -->

Given:

- $n = 2$
- $c \in \operatorname{Seq}_{n}(\mathbb{R})$
- $d \in \operatorname{Seq}_{n}(\mathbb{R})$

WTS $\operatorname{diag}(c) = \operatorname{diag}(c)$

<details>
<summary>✅ verified</summary>

No premises seemed necessary to show this.
</details>

::right::

1. $\operatorname{diag}(c) = \operatorname{diag}(d)$

   <details>
   <summary>❌ counterexample found</summary>

   The negation of $\operatorname{diag}(c) = \operatorname{diag}(d)$ is satisfied by:

   - $c_{1} = \square$
   - $c_{2} = 2$
   - $d_{1} = \square$
   - $d_{2} = 3$
   - $n = 2$
   </details>
2. $\operatorname{diag}(c_{1}, \ldots, d_{n}) = \operatorname{diag}(c)$

   <details>
   <summary>Unsupported step</summary>

   no candidate range expression matched the visible sequence elements
   </details>
3. $\operatorname{diag}(c_{1}, \ldots, c_{n}) = \operatorname{diag}(c)$

   <details>
   <summary>✅ verified</summary>

   No premises seemed necessary to show this.
   </details>

---
layout: two-cols
class: proof-example
---

# Example involving quantifiers/proof rules: Range is closed under linear combinations

*Timing: 21.2 ms*

<!-- Source: linalg-checker/tests/fixtures/validate_arguments_output.md — Range is closed under linear combinations -->

Given:

- $A \in \mathbb{R}^{2 \times 2}$
- $x \in \mathbb{R}^{2}$
- $y \in \mathbb{R}^{2}$
- $a \in \mathbb{R}$
- $b \in \mathbb{R}$
- $x \in \operatorname{Range}(A)$
- $y \in \operatorname{Range}(A)$

::right::

WTS $a x + b y \in \operatorname{Range}(A)$

<details>
<summary>✅ witness found</summary>

Witness:

- $w_{preimage of A} = a u + b v$

Matched facts:

- $a x + b y = A \left(a u + b v\right)$
</details>

1. $x = A u$

   <details>
   <summary>✅ witness introduced</summary>

   From $x \in \operatorname{Range}(A)$:

   - $u$ as a witness for $w_{preimage of A}$
   </details>
2. $y = A v$

   <details>
   <summary>✅ witness introduced</summary>

   From $y \in \operatorname{Range}(A)$:

   - $v$ as a witness for $w_{preimage of A}$
   </details>
3. $a x + b y = A \left(a u + b v\right)$

   <details>
   <summary>✅ verified</summary>

   This follows from the following facts:

   - $x \in \operatorname{Range}(A)$
   - $y \in \operatorname{Range}(A)$
   - $x = A u$
   - $y = A v$
   </details>
4. $a x + b y \in \operatorname{Range}(A)$

   <details>
   <summary>✅ witness found</summary>

   Witness:

   - $w_{preimage of A} = a u + b v$

   Matched facts:

   - $a x + b y = A \left(a u + b v\right)$
   </details>

<!-- todo: give the execution time on a 6-core laptop because this is the main difference wrt llm -->

<style>
.proof-example .slidev-layout {
  font-size: 0.78em;
}

.proof-example h2 {
  line-height: 1.05;
  margin-bottom: 0.5rem;
}

.proof-example .col-left,
.proof-example .col-right {
  min-width: 0;
}

.proof-example ul,
.proof-example ol {
  margin-top: 0.35rem;
}

.proof-example li {
  margin-bottom: 0.25rem;
}

.proof-example details {
  margin: 0.35rem 0 0.55rem;
  font-size: 0.9em;
}

.proof-example details p,
.proof-example details ul {
  margin-top: 0.25rem;
  margin-bottom: 0.25rem;
}

</style>

---

## Architecture

```mermaid
flowchart LR
    MD[Markdown / TeX] --> AST["Expr&lt;()&gt;"]
    AST --> STE[SymbolicTypeEnvironment]
    AST --> PREP["<b>Dimension-free elaboration<b>"]
    STE --> PREP
    PREP --> DIM[Dimension constraints]
    DIM --> ENV["<b>Environment enumeration<b>"]
    PREP --> ELAB["<b>Concrete elaboration<b>"]
    ENV --> ELAB
    ELAB --> Z3[Scalar-cell Z3 lowering]
    Z3 --> SOLVE[Solver query]
    SOLVE --> RESULT[Model, counterexample, or proof result]
```

<style>
.slidev-layout {
  display: flex;
  flex-direction: column;
}

.mermaid {
  margin-block: auto;
}
</style>

---

## Regarding CNL

- Not the core motivation.
- Orthogonal to the SMT-solving/decision procedures aspect of this prototype
- But perhaps independently interesting:
  - Can choice of syntax cut the gordian knot of faithfulness?
    - cosine similarity in embedding space as a poor faithfulness metric. Some directions in embedding space don't correspond to our application-specific notion of similarity?
      - option 1: don't use the embeddings
      - option 2: learn a regression model that predicts faithfulness from embeddings
      - option 3: **eliminate/discourage differences along the irrelevant directions**

---

## What has "wide wall" done for us?

Related: "What has mathlib done for us?"

- The appeal is obvious
  - Without it, we are no better than unusable ITS of prior decades
- The opportunity is obvious
  - LLMs can accept almost any textual input
  - Almost any proposition can be expressed using constructs from mathlib
- **Feasibility**
  - The implementation is here!
    - or at least, it is close? pending library learning?
  - "wide wall" QA/alignment remains aspirational
- **Desirability**: "wide wall" (taken to the extreme) might actually be the **worst thing** about LLM tutors?

---

## Future work?

- Generate Lean from linalg-checker IR?
  - Can be seen as a competing approach to the existing scaffolder
- Lift from Lean to linalg-checker IR?
  - This could allow use of the checker in a tactic
- Graceful handling of unsupported expressions ("graceful degradation" as an explicit "wide wall" compromise)
  - Because each step "makes sense" on its own, it is OK if some steps aren't supported by the IR or by the validation procedure
- Refinement using formalization rollouts on realistic proofs
  - Without CNL parsing: respond to parse failures by updating the **formalization prompt**
  - With CNL parsing: can also respond to parse failures by updating the **parsing code**
    - There is existing work on "code updates as a form of online learning". See Dreamcoder.

---

## Future work?

- **Target SMT theories other than QF_NRA** (e.g., EUF) that can apply algebraic identities
  - This will tend to involve **underapproximating the semantics of input formulas** by omitting some function/relation semantics and omitting facts from the context
- **Decide k-step provability** from finite collection of deduction rules + lemma library
  - BMC-like approach to provability -- not just "use `aesop`"
    - An excuse to work on theory of ADTs + theory combination?
- **Generalize to a framework**
  - related to ongoing library learning work
  - Extension points:
    - syntax: operator library w/ parse rules etc.
    - rewrite library

---

## Future work: partial concretization?

- Potential problem: QF_NRA could turn out to be slow, e.g. because counterexamples of small dimension may not exist
- idea:
  - if counterexamples of dimension $n$ are a manifold $W$ of dimension $k < n$,
  - and you leave $d$ values symbolic while randomly setting the remaining values randomly,
  - then the $d$-dimensional counterexample candidate space $U$ that the solver searches over
  - may satisfy that $p(U \cap W) \neq 0$
- In other words: concolic testing for math

<img src="/affine-space-cex-cropped.png" alt="Candidate and actual counterexamples intersecting a manifold" style="max-width: 60%; max-height: 32vh; height: auto; object-fit: contain; display: block; margin: 0 auto" />
